import { Kafka } from "kafkajs";

export default class QLogTransporter {

    static #topicName;
    static #kafkaProducer;
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
        
        const message = logMessage.message ? logMessage.message.trim(): '';
        logMessage.message = btoa(message);
        await QLogTransporter.#kafkaProducer.send({
            topic: QLogTransporter.#topicName,
            messages: [{
                partition: 0,
                value: JSON.stringify(logMessage)
            }]
        });
    }

    static #validateAndClean(bootstrapServers, appName) {
        if (!bootstrapServers) {
            throw Error('Valid value for bootstrapServers parameter is required.');
        }

        if (!appName) {
            throw Error('Valid value for appName parameter is required.');
        }

        bootstrapServers = bootstrapServers.trim();
        appName = appName.trim();
        return { bootstrapServers, appName };
    }
}
