import QLogTransporter from 'logtransporter';
import Transport from 'winston-transport';

const PRIVATE_CONSTRUCTOR_KEY = Symbol();
export default class QWinstonTransport extends Transport {
    constructor(opts, privateConstructorKey) {
        if (privateConstructorKey !== PRIVATE_CONSTRUCTOR_KEY) {
            throw Error('Initialize QWinstonTransport by using QWinstonTransport.init(...) method.');
        }
        super(opts);
    }
    static async init(opts) {
        await QLogTransporter.init(opts.bootstrapServers, opts.appName);
        return new QWinstonTransport(opts, PRIVATE_CONSTRUCTOR_KEY);
    }
    log(info, callback) {
        const obj = {};
        if (info.stack) {
            obj.message = info.stack;
        } else {
            obj.message = info.message;
        }
        obj.level = info.level;
        obj.loggerName = info.label;
        obj.logTime = new Date();
        obj.logCreatedAt = new Date();
        
        QLogTransporter.send(obj).then(() => callback());
    }

};