const child_process = require('child_process');
const path = require('path');

module.exports = {
    runBench(mod, bench, message) {
        return new Promise((res, rej) => {
            const startTs = Date.now();
            const out = [];
            const getData = json => {
                try {
                    const msg = JSON.parse(json);
                    out.push(msg);
                    message(msg);
                } catch (e) {}                                // eslint-disable-line no-empty

                return out;
            };
            const process = child_process.fork(path.join(__dirname, "./exec-bench-child"), [mod, bench]);

            process.on('error', rej);
            process.on('message', getData);
            process.on('exit', ({exit}) => res(getData({exit, startTs, finalTs: Date.now()})));
        });
    }
};
