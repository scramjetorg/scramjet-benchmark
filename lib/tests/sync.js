const crypto = require('crypto');
const {DataStream} = require('scramjet');

const mapper = (data) => crypto.createHash("md5").update('xyz').update(data).update('ijk').digest('hex');
const filter = (hex) => hex[0] === 'f';
const reducer = (acc, hex) => (acc[hex[1]]++, acc);

module.exports = {
    title: "Synchronous data map/filter/reduce test",
    description: "Performs list a synchronous md5 calculation on 10 million",
    beforeTest() {
        function* gen() {
            let n = 0;
            while (n++ < 50e3) {
                yield "abc" + n;
            }
        }
        const dat = {"0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 0, "9": 0, "a": 0, "b": 0, "c": 0, "d": 0, "e": 0, "f": 0 };

        return {gen, dat};
    },
    bench: {
        async scramjet({gen, dat}) {
            return DataStream.fromIterator(gen())
                .map(mapper)
                .filter(filter)
                .reduce(reducer, dat)
            ;
        },
        array({gen, dat}) {
            return Array.from(gen())
                .map(mapper)
                .filter(filter)
                .reduce(reducer, dat);
        }
    }
};
