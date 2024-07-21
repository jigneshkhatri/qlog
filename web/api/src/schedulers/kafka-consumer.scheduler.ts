import Cron from "croner";
import KafkaConsumer from "../kafka-consumers/kafka-consumer";

export function newTopicSubscriptionScheduler(): void {
	Cron(
		'*/5 * * * * *',  // every 5 seconds
		{
			name: 'TOPIC-SUBSCRIPTION',
			protect: true,
		},
		async () => {
			await KafkaConsumer.getInstance().subscribeAllTopics();
		}
	);
}
