const child_process = require('child_process');
const path = require('path');

module.exports = {
    async getBenches(mod) {
        const {bench} = require(mod);
        return Object.keys(bench);
    },
    async runBench(mod, bench, message) {
        const {sibling} = require(mod);
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

        let sibling_process;
        const sibling_outcome = await (sibling ? new Promise((res, rej) => {
            sibling_process = child_process.fork(path.join(__dirname, "./exec-bench-child"), [mod, "sibling"]);
            sibling_process.on('error', rej);
            sibling_process.once("message", res);
        }) : Promise.resolve());

        const execTs = Date.now();

        const process_outcome = await new Promise((res, rej) => {
            const main_process = child_process.fork(path.join(__dirname, "./exec-bench-child"), [mod, "bench", bench, sibling_outcome]);

            main_process.on('error', rej);
            main_process.on('message', getData);
            main_process.on('exit', res);
        });

        if (sibling)
            sibling_process.kill();

        return getData({process_outcome, startTs, execTs, finalTs: Date.now()});
    }
};
