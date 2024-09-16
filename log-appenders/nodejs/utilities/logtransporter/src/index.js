import { Kafka } from "kafkajs";
import { Writable } from 'stream';
import { escapeString } from "./utils/utility.js";

export default class QLogTransporter {

    static #topicName;
    static #kafkaProducer;
    static #appNameRegex = /[A-Za-z-]{1,15}/;
    constructor() {
        throw Error('Cannot instantiate this class');
    }

    static async init(bootstrapServers, appName) {
        if (QLogTransporter.#kafkaProducer) {
            return;
        }

        ({ bootstrapServers, appName } = QLogTransporter.#validateAndClean(bootstrapServers, appName));

        QLogTransporter.#topicName = 'qlog-' + appName;
        const kafkaClient = new Kafka({
            clientId: 'qlog-nodejs-logtransporter',
            brokers: [bootstrapServers]
        });

        QLogTransporter.#kafkaProducer = kafkaClient.producer({
            allowAutoTopicCreation: true
        });

        await QLogTransporter.#kafkaProducer.connect();
    }

    static async send(logMessage) {
        if (!QLogTransporter.#kafkaProducer) {
            throw Error('Log transporter is not initialized yet. Call QLogTransporter.init(...) method first to initialize.');
        }
        
        logMessage.message = escapeString(logMessage.message);
        if (logMessage.errStack) {
            logMessage.errStack = escapeString(logMessage.errStack);
        }

        await QLogTransporter.#kafkaProducer.send({
            topic: QLogTransporter.#topicName,
            messages: [{
                partition: 0,
                value: JSON.stringify(logMessage)
            }]
        });
    }

    static stream(transformFn) {
        return new Writable({
            write(chunk, encoding, callback) {
                const info = JSON.parse(chunk.toString());
                const logObj = transformFn(info);
                QLogTransporter.send(logObj).then(() => {
                    callback();
                });
            }
        });
    }

    static #validateAndClean(bootstrapServers, appName) {
        bootstrapServers = bootstrapServers?.trim();
        appName = appName?.trim();

        if (!bootstrapServers) {
            throw Error('Valid value for bootstrapServers parameter is required.');
        }

        if (!appName || !this.#appNameRegex.test(appName)) {
            throw Error('Valid value for appName parameter is required. appName should only contain alphabets and hyphen (-) and should be of max 15 characters long.');
        }

        return { bootstrapServers, appName };
    }
}
