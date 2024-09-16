import { Document, ObjectId } from "mongodb";
import MongoCollectionName from "../constants/mongo-collection-name.constant";
import AllQLogApps from "../entities/all-qlog-apps.entity";
import { convertEntityToMongoData, convertMongoDataToEntity } from "../utils/db-entity.util";
import CommonMongoRepository from "./common/common.mongo.repository";
import UUID from "../types/uuid.type";

export default class AllQLogAppsRepository extends CommonMongoRepository<AllQLogApps> {
    private static _instance: AllQLogAppsRepository;

	// Initiate all the dependencies required in this class.
	// Keeping constructor private, to follow Singleton design pattern.
	private constructor() {
        super(MongoCollectionName.allQLogApps, AllQLogApps);
	}

	// The only method available to initiate the instance of this class and return wherever required.
	public static getInstance(): AllQLogAppsRepository {
		if (!this._instance) {
			this._instance = new AllQLogAppsRepository();
		}
		return this._instance;
	}

    public async findAll(): Promise<AllQLogApps[]> {
		const result = await this.collection.find({}).toArray();
        return convertMongoDataToEntity(result, AllQLogApps) as AllQLogApps[];
	}

    public async upsertApps(qLogAppsToSave: AllQLogApps[]): Promise<void> {
        qLogAppsToSave.forEach(async obj => {
            const singleApp = convertEntityToMongoData(AllQLogApps, obj) as Document;
            delete singleApp._id;
            await this.collection.updateOne({
                'app_name': singleApp.app_name
            }, {
                $setOnInsert: singleApp
            }, {
                upsert: true
            });
        });
    }

    public async findById(id: UUID): Promise<AllQLogApps | undefined> {
        const qLogApps: AllQLogApps[] | undefined = await this.findByCriteria({'_id': new ObjectId(id)});
        if (!qLogApps || !qLogApps.length) {
            return undefined;
        }
        return qLogApps[0];
    }
}