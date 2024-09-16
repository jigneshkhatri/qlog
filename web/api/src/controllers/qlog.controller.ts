import { getEnvValue } from "../configs/env.config";
import { EnvKeys } from "../constants/env-keys.constant";
import QLogSearchResponseDTO from "../dtos/qlog-search-response.dto";
import QLogSearchDTO from "../dtos/qlog-search.dto";
import QLog from "../entities/qlog.entity";
import KafkaConsumer from "../kafka-consumers/kafka-consumer";
import QLogRepository from "../repositories/qlog.repository";
import { convertEntityToMongoData } from "../utils/db-entity.util";
import { getDateBeforeNDays } from "../utils/helper.util";
import PaginationParams from "../utils/pagination/pagination.param";
import AllQLogAppsController from "./all-qlog-apps.controller";
import { Response } from "express";

export default class QLogController {
  private static _instance: QLogController;
  private _qLogRepository: QLogRepository;
  private _allQLogAppsController: AllQLogAppsController;

  // Initiate all the dependencies required in this class.
  // Keeping constructor private, to follow Singleton design pattern.
  private constructor() {
    this._qLogRepository = QLogRepository.getInstance();
    this._allQLogAppsController = AllQLogAppsController.getInstance();
  }

  // The only method available to initiate the instance of this class and return wherever required.
  public static getInstance(): QLogController {
    if (!this._instance) {
      this._instance = new QLogController();
    }
    return this._instance;
  }

  public async insertLog(topicName: string, log: QLog): Promise<void> {
    if (!topicName || !log || !Object.keys(log).length) {
      return;
    }
    log.createdOn = new Date();
    log.logTime = new Date(log.logTime);
    log.logCreatedAt = new Date(log.logCreatedAt);
    // const logToSave = convertEntityToMongoData(QLog, log);
    await this._qLogRepository.insertLog(topicName, log);
  }

  public async archiveLogs(): Promise<void> {
    console.log("----------------- Starting archiveLogs -----------------");
    const allApps = await this._allQLogAppsController.findAll();
    const thresholdDate = getDateBeforeNDays(
      parseInt(getEnvValue(EnvKeys.thresholdDaysToArchiveLogs)) || 5
    );
    for (const app of allApps) {
      await this._qLogRepository.archiveLogs(
        app.kafkaTopicName,
        thresholdDate,
        100
      );
    }
    console.log("----------------- End archiveLogs -----------------");
  }

  public async purgeArchivedLogs(): Promise<void> {
    console.log(
      "----------------- Starting purgeArchivedLogs -----------------"
    );
    const allApps = await this._allQLogAppsController.findAll();
    const thresholdDate = getDateBeforeNDays(
      parseInt(getEnvValue(EnvKeys.thresholdDaysToPurgeArchivedLogs)) || 15
    );
    for (const app of allApps) {
      await this._qLogRepository.purgeArchivedLogs(
        app.kafkaTopicName,
        thresholdDate
      );
    }
    console.log("----------------- End purgeArchivedLogs -----------------");
  }

  public async stream(appId: string, res: Response) {
    const app = await this._allQLogAppsController.findById(appId);
    KafkaConsumer.getInstance().streamMessage(app.kafkaTopicName, res);
  }

  public async search(
    appId: string,
    searchCriteria: QLogSearchDTO | undefined,
    lastCreatedOn: string | undefined
  ): Promise<QLogSearchResponseDTO> {
    const app = await this._allQLogAppsController.findById(appId);

    // for pagination, pass the lastCreatedon and compare
    // this lastCreatedOn in filter with createdOn field 
    // with less than operation and add limit
    // also sort results by createdOn
    const logs = await this._qLogRepository.search(
      app.kafkaTopicName,
      searchCriteria,
      lastCreatedOn
    );

    const response = new QLogSearchResponseDTO();
    if (!logs?.length) {
      response.lastCreatedOn = lastCreatedOn;
      response.logs = [];
    } else {
      response.lastCreatedOn = logs[logs.length - 1].createdOn.toISOString();
      response.logs = logs;
    }
    return response;
  }
}
