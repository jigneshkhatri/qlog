import QLogTransporter from 'logtransporter';

export default class QPinoTransportStream {
    static #isInitialized = false;
    static #logLevels = {
        60: 'fatal',
        50: 'error',
        40: 'warn',
        30: 'info',
        20: 'debug',
        10: 'trace'
    };
    static #fieldsToExclude = new Set(['level', 'time', 'pid', 'hostname', 'name', 'msg', 'err']);
    constructor() {
        throw Error('Please use init(...) method to initialize QPinoTransportStream.');
    }
    static async init({bootstrapServers, appName}) {
        if (QPinoTransportStream.#isInitialized) {
            throw Error('QPinoTransportStream is already initialized in this project.');
        }
        await QLogTransporter.init(bootstrapServers, appName);
        QPinoTransportStream.#isInitialized = true;
    }

    static stream() {
        return QLogTransporter.stream((info) => {
            const logObj = {};
            if (info?.err?.stack) {
                logObj.errStack = info.err.stack;
            }
            logObj.message = info.msg;
            logObj.level = QPinoTransportStream.#logLevels[info.level];
            logObj.logTime = new Date(info.time);
            logObj.logCreatedAt = new Date();
            logObj.loggerName = info.name;

            const customObject = Object.fromEntries(Object.entries(info)
                .filter(e => !QPinoTransportStream.#fieldsToExclude.has(e[0])));
            if (customObject && Object.keys(customObject).length) {
                logObj.customObject = customObject;
            }
            return logObj;
        });
    }
}