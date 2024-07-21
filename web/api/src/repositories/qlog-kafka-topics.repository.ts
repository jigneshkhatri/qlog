import MongoConfig from "../configs/mongo.config";
import MongoCollectionName from "../constants/mongo-collection-name.constant";
import QLogKafkaTopic from "../entities/qlog-kafka-topic.entity";
import CommonMongoRepository from "./common/common.mongo.repository";

export default class QLogKafkaTopicsRepository extends CommonMongoRepository<QLogKafkaTopic> {
    private static _instance: QLogKafkaTopicsRepository;

	// Initiate all the dependencies required in this class.
	// Keeping constructor private, to follow Singleton design pattern.
	private constructor() {
        super(MongoCollectionName.qlogKafkaTopics, QLogKafkaTopic);
	}

	// The only method available to initiate the instance of this class and return wherever required.
	public static getInstance(): QLogKafkaTopicsRepository {
		if (!this._instance) {
			this._instance = new QLogKafkaTopicsRepository();
		}
		return this._instance;
	}

    public async findAll(): Promise<QLogKafkaTopic[]> {
		const result = await this.collection.find({});
		return result.toArray();
	}

    public async upsertTopics(topics: string[]): Promise<void> {
        topics.forEach(async x => {
            const obj = new QLogKafkaTopic();
            obj.topicName = x;
            obj.createdOn = new Date();
            obj.updatedOn = new Date();
            
            await this.collection.updateOne({
                'topic_name': x
            }, {
                $setOnInsert: obj
            }, {
                upsert: true
            });
        });
    }
}