import { convertEntityToMongoData } from "../utils/db-entity.util";
import MongoConfig from "../configs/mongo.config";
import QLog from "../entities/qlog.entity";

export default class QLogRepository {

    private static _instance: QLogRepository;

	// Initiate all the dependencies required in this class.
	// Keeping constructor private, to follow Singleton design pattern.
	private constructor() {
	}

	// The only method available to initiate the instance of this class and return wherever required.
	public static getInstance(): QLogRepository {
		if (!this._instance) {
			this._instance = new QLogRepository();
		}
		return this._instance;
	}

	public async insertLog(topicName: string, log: any): Promise<void> {
		const collection = MongoConfig.getDatabase().collection(topicName);
		log.createdOn = new Date();
		log.logTime = new Date(log.logTime);
		log.logCreatedAt = new Date(log.logCreatedAt);
		const logToSave = convertEntityToMongoData(QLog, log);
		await collection.insertOne(logToSave as any);
	}

}