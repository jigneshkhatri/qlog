import AllQLogApps from "../entities/all-qlog-apps.entity";
import DataNotFound from "../errors/data-not-found.error";
import RequestValidationError from "../errors/request-validation.error";
import AllQLogAppsRepository from "../repositories/all-qlog-apps.repository";
import UUID from "../types/uuid.type";

export default class AllQLogAppsController {
  private static _instance: AllQLogAppsController;
  private _allQLogAppsRepository: AllQLogAppsRepository;

  // Initiate all the dependencies required in this class.
  // Keeping constructor private, to follow Singleton design pattern.
  private constructor() {
    this._allQLogAppsRepository = AllQLogAppsRepository.getInstance();
  }

  // The only method available to initiate the instance of this class and return wherever required.
  public static getInstance(): AllQLogAppsController {
    if (!this._instance) {
      this._instance = new AllQLogAppsController();
    }
    return this._instance;
  }

  public async findAll(): Promise<AllQLogApps[]> {
    return await this._allQLogAppsRepository.findAll();
  }

  public async upsertKafkaTopics(topics: string[]): Promise<void> {
    if (!topics?.length) {
      return;
    }

    const qLogAppsToSave: AllQLogApps[] = [];
    topics.forEach(async (x) => {
      if (!x.startsWith("qlog-")) {
        return;
      }
      const obj = new AllQLogApps();
      obj.kafkaTopicName = x;
      obj.appName = x.substring(5); // by removing qlog- from the topic name we get the app name
      obj.createdOn = new Date();
      obj.updatedOn = new Date();
      qLogAppsToSave.push(obj);
    });
    await this._allQLogAppsRepository.upsertApps(qLogAppsToSave);
  }

  public async findById(id: UUID): Promise<AllQLogApps> {
	if (!id) {
		const validationError = [{
			field: 'id',
			message: 'Valid id is required',
		}];
		throw new RequestValidationError(RequestValidationError.errors.CGRVE0001.code, RequestValidationError.errors.CGRVE0001.message, validationError);
	}

	const app = await this._allQLogAppsRepository.findById(id);
	if (!app) {
		throw new DataNotFound(`No app found with given id [${id}]`);
	}
    return app;
  }
}
