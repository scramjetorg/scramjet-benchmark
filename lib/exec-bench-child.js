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
const benchname = process.argv[3];

(async () => {
    send("load");

    const {title, description, beforeTest, bench} = require(modulename);
    if (!title) {
        throw new Error("Bench module not complete - missing title");
    }
    if (!description) {
        throw new Error("Bench module not complete - missing description");
    }
    if (!bench) {
        throw new Error("Bench module not complete - missing bench");
    }

    const func = bench[benchname];
    if (!func) {
        throw new Error(`Banch named ${benchname} not found on the list.`);
    }

    send("prep");

    const initial = await beforeTest();

    send("start");

    const outcome = await func(initial);

    send("done", outcome);

    process.exit(0);

})().catch(
    ({type, message, stack}) => {
        send("error", {type, message, stack});
        process.exit(1);
    }
);
