/* eslint no-process-exit: 0 */

const send = (name, data) => {
    const obj = {
        name,
        data,
        ts: Date.now(),
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage()
    };

    process.send(JSON.stringify(obj));
};
const modulename = process.argv[2];
const type = process.argv[3];
const benchname = process.argv[4];
const sibling_outcome = process.argv[5];

(async () => {
    try {
        let func, initial;
        const {title, description, beforeTest, sibling, bench} = require(modulename);

        if (type === "bench") {
            send("load");

            if (!title)
                throw new Error("Bench module not complete - missing title");
            if (!description)
                throw new Error("Bench module not complete - missing description");
            if (!bench)
                throw new Error("Bench module not complete - missing bench");

            func = bench[benchname];
            if (!func)
                throw new Error(`Banch named ${benchname} not found on the list.`);

            send("prep");

            initial = await beforeTest(sibling_outcome);

            send("start");

            const outcome = await func(initial);

            send("done", outcome);

            process.exit(0);
        } else {
            func = sibling;
            const outcome = await func(initial);
            send("sibling_start", outcome);
        }
    } catch(e) {
        send("error", {type: e.type, message: e.message, stack: e.stack});
        process.exit(1);
    }
})();
