import QLogTransporter from 'logtransporter';
import { Writable } from 'stream';

export default class QWinstonTransportStream {

    constructor() {
        throw Error('Please use init(...) method to initialize QWinstonTransport.');
    }
    static async init({bootstrapServers, appName}) {
        await QLogTransporter.init(bootstrapServers, appName);
    }

    static stream() {
        const outStream = new Writable({
            write(chunk, encoding, callback) {
                const info = JSON.parse(chunk.toString());
                const logObj = {};
                if (info.stack) {
                    logObj.message = info.stack;
                } else {
                    logObj.message = info.message;
                }
                logObj.level = info.level;
                logObj.loggerName = info.label;
                logObj.logTime = new Date();
                logObj.logCreatedAt = new Date();
                QLogTransporter.send(logObj).then(() => {
                    callback();
                });
            },
        });
        return outStream;
    }
}