import QLogTransporter from 'logtransporter';
import build from 'pino-abstract-transport';

export default class QPinoTransport {

    static #logLevels = {
        60: 'fatal',
        50: 'error',
        40: 'warn',
        30: 'info',
        20: 'debug',
        10: 'trace'
    };
    constructor() {
        throw Error('Cannot initialize QPinoTransport');
    }
    static async init(opts) {
        await QLogTransporter.init(opts.bootstrapServers, opts.appName);
        const parseLine = typeof opts.parseLine === 'function' ? opts.parseLine : JSON.parse;
        return build(async (source) => {
            source.on('data', async (info) => {
                const logObj = {};
                if (info?.err?.stack) {
                    logObj.message = info.err.stack;
                } else {
                    logObj.message = info.msg;
                }
                logObj.level = QPinoTransport.#logLevels[info.level];
                logObj.logTime = new Date(info.time);
                logObj.logCreatedAt = new Date();
                await QLogTransporter.send(logObj);
            });
        }, parseLine);
    }
}