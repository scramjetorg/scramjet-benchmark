const crypto = require('crypto');
const http = require("http");
const {DataStream} = require('scramjet');
const _ =  require("lodash");
const async = require("async");

const PORT = 12387;

const mapper = (data) => crypto.createHash("md5").update('xyz').update(data.toString('utf-8')).update('ijk').digest('hex').slice(0, 2);
const filter = (hex) => hex[0] === 'f';
const reducer = (acc, hex) => (acc[hex[1]]++, acc);
const defer = (ms) => new Promise(res => setTimeout(res, ms));

const httpGet = async (options) => new Promise(
    (res, rej) => http.get(options, (response) => res(response)).on('error', rej)
);

const get = async (src) => {
    const response = await httpGet(`http://127.0.0.1:${PORT}/?x=${src}`);

    const data = await new Promise((res, rej) => {
        response.once('data', x => res(x.toString('utf-8')));
        response.once('end', rej);
    });

    return data;
};

module.exports = {
    title: "Synchronous data map/filter/reduce test",
    description: "Performs list a synchronous md5 calculation on 10 million",
    async sibling() {
        return new Promise((res, rej) => {
            let n = 0;
            const srv = http.createServer(async (request, response) => {
                await defer(17 + (n = (n + 1) % 6) * 4);
                response.writeHead(200);
                response.end(mapper(request.url));
            }).listen({host: "127.0.0.1", port: PORT}, res);

            srv.on("error", rej);
        });
    },
    beforeTest() {
        function* gen() {
            let n = 0;
            while (n++ < 10e3) {
                yield "abc" + n;
            }
        }
        const dat = {"0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "a": 0, "b": 0, "c": 0, "d": 0, "e": 0, "f": 0 };

        return {gen, dat};
    },
    bench: {
        async scramjet({gen, dat}) {
            return DataStream.fromIterator(gen())
                .setOptions({maxParallel: 512})
                .map(get)
                .map(get)
                .map(get)
                .filter(filter)
                .reduce(reducer, dat)
            ;
        },
        async async({gen, dat}) {
            let data = Array.from(gen());

            let arr = await new Promise((res, rej) => {
                async.mapLimit(data, 512, async (item) => {
                    let data = await get(item);
                    data = await get(data);
                    return get(data);
                }, (err, result) => err ? rej(err) : res(result));
            });

            return arr.filter(filter).reduce(reducer, dat);
        },
        async lodash({gen, dat}) {
            let data = Array.from(gen());

            data = await Promise.all(_.map(data, get));
            data = await Promise.all(_.map(data, get));
            data = await Promise.all(_.map(data, get));
            data = await Promise.all(_.filter(data, filter));

            return data.reduce(reducer, dat);
        }
    }
};
