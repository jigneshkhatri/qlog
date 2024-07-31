import QLogTransporter from 'logtransporter';
import { Writable } from 'stream';

export default class QBunyanStream {

    static #logLevels = {
        60: 'fatal',
        50: 'error',
        40: 'warn',
        30: 'info',
        20: 'debug',
        10: 'trace'
    };
    constructor() {
        throw Error('Please use init(...) method to initialize QBunyanStream.');
    }
    static async init({bootstrapServers, appName}) {
        await QLogTransporter.init(bootstrapServers, appName);
    }

    static stream() {
        const outStream = new Writable({
            write(chunk, encoding, callback) {
                const info = JSON.parse(chunk.toString());
                const logObj = {};
                if (info?.err?.stack) {
                    logObj.message = info.err.stack;
                } else {
                    logObj.message = info.msg;
                }
                logObj.level = QBunyanStream.#logLevels[info.level];
                logObj.logTime = new Date(info.time);
                logObj.logCreatedAt = new Date();
                logObj.loggerName = info.name;
                QLogTransporter.send(logObj).then(() => {
                    callback();
                });
            },
        });
        return outStream;
    }
}