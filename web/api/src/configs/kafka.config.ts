import { Consumer, Kafka } from "kafkajs";
import { getEnvValue } from "./env.config";
import { EnvKeys } from "../constants/env-keys.constant";

export default class KafkaConfig {

    private static _kafkaClient: Kafka;
    private static _kafkaConsumer: Consumer;

    /**
	 * Initialize the Kafka client using connection string.
	 * This method will only be called during application startup,
	 * thus there will be only one Kafka client for application.
	 */
	private static _init(): void {
        if (KafkaConfig._kafkaClient) {
            return;
        }

		KafkaConfig._kafkaClient = new Kafka({
            clientId: getEnvValue(EnvKeys.kafkaClientId),
            brokers: [getEnvValue(EnvKeys.kafkaBrokers)]
        });
		console.log('Kafka client initialized');
	}

    /**
	 *
	 * @returns Singleton instance of `Kafka`
	 */
	public static getClient(): Kafka {
		return KafkaConfig._kafkaClient;
	}

    public static getConsumer(): Consumer {
        return KafkaConfig._kafkaConsumer;
    }

    public static async connectConsumer(): Promise<void> {
        KafkaConfig._init();
        KafkaConfig._kafkaConsumer = KafkaConfig._kafkaClient.consumer({ groupId: 'qlog-api-consumer-group' });
        return KafkaConfig._kafkaConsumer.connect();
    }

    public static async disconnectConsumer(): Promise<void> {
        return KafkaConfig.getConsumer().disconnect();
    }

}