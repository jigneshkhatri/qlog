import { Collection, Document } from "mongodb";
import MongoConfig from "../configs/mongo.config";
import {
  convertEntityToMongoData,
  convertMongoDataToEntity,
} from "../utils/db-entity.util";
import QLog from "../entities/qlog.entity";
import QLogSearchDTO from "../dtos/qlog-search.dto";
import { logger } from "../configs/logger.config";

export default class QLogRepository {
  private static _instance: QLogRepository;
  private _collections: { [key: string]: any } = {};

  private readonly archived = "-archived";

  // Initiate all the dependencies required in this class.
  // Keeping constructor private, to follow Singleton design pattern.
  private constructor() {}

  // The only method available to initiate the instance of this class and return wherever required.
  public static getInstance(): QLogRepository {
    if (!this._instance) {
      this._instance = new QLogRepository();
    }
    return this._instance;
  }

  private _getCollection(collectionName: string): Collection {
    let collection = this._collections[collectionName];
    if (!collection) {
      collection = MongoConfig.getDatabase().collection(collectionName);
      this._collections[collectionName] = collection;
    }
    return collection;
  }

  public async insertLog(topicName: string, log: QLog): Promise<void> {
    const logToSave = convertEntityToMongoData(QLog, log);
    let collection = this._getCollection(topicName);
    await collection.insertOne(logToSave as Document);
  }

  public async archiveLogs(
    topicName: string,
    thresholdDate: Date,
    batchSize: number
  ): Promise<void> {
    const filter = { created_on: { $lt: thresholdDate } };
    const sourceCollection = this._getCollection(topicName);
    const targetCollection = this._getCollection(topicName + this.archived);
    let totalArchivedLogs = 0;
    let retrials = 0;
    while (
      (await sourceCollection.countDocuments(filter)) > 0 &&
      retrials < 5
    ) {
      const session = MongoConfig.getClient().startSession();
      try {
        session.startTransaction();
        const logs = await sourceCollection
          .find(filter, { session })
          .limit(batchSize)
          .toArray();
        if (logs?.length) {
          const ids = logs.map((x) => x._id);
          await targetCollection.insertMany(logs, { session });
          await sourceCollection.deleteMany(
            {
              _id: { $in: ids },
            },
            { session }
          );
        }
        await session.commitTransaction();
        retrials = 0;
        totalArchivedLogs += logs?.length;
      } catch (e) {
        retrials++;
        console.log("Error occurred in transaction, rolling back");
        console.log(e);
        await session.abortTransaction();
      } finally {
        await session.endSession();
      }
    }
    console.log(
      "Total [%d] logs archived for [%s] collection",
      totalArchivedLogs,
      topicName
    );
  }

  public async purgeArchivedLogs(
    topicName: string,
    thresholdDate: Date
  ): Promise<void> {
    const filter = { created_on: { $lt: thresholdDate } };
    const collection = this._getCollection(topicName + this.archived);
    const res = await collection.deleteMany(filter);
    console.log(
      "Total [%d] logs purged for [%s] collection",
      res.deletedCount,
      topicName + this.archived
    );
  }

  public async search(
    kafkaTopicName: string,
    searchCriteria: QLogSearchDTO | undefined,
    lastCreatedOn: string | undefined
  ): Promise<QLog[]> {
    const collection = this._getCollection(kafkaTopicName);
    const archivedCollection = this._getCollection(
      kafkaTopicName + this.archived
    );
    const orderByClause = '{ "created_on": "desc" }';
    let pageSize = 20;
    const filter = this.generateSearchFilters(searchCriteria, lastCreatedOn);

    logger.info('---------------------------');
    logger.info(JSON.stringify(filter));
    logger.info('---------------------------');
    // get results from main collection
    let results =
      (await collection
        .find(filter)
        .sort(JSON.parse(orderByClause))
        .limit(pageSize)
        .toArray()) || [];

    // if results are less than the page size, then get other logs from archived collection
    if (results.length < pageSize) {
      pageSize = pageSize - results.length;
      results = [
        ...results,
        ...((await archivedCollection
          .find(filter)
          .sort(JSON.parse(orderByClause))
          .limit(pageSize)
          .toArray()) || []),
      ];
    }
    return convertMongoDataToEntity(results, QLog) as QLog[];
  }

  private generateSearchFilters(
    searchCriteria: QLogSearchDTO | undefined,
    lastCreatedOn: string | undefined,
  ) {
    const filter: { [key: string]: any } = {};

    const mainAndClause = [];

    if (lastCreatedOn) {
      mainAndClause.push({ created_on: { $lt: new Date(lastCreatedOn) } });
    }

    if (searchCriteria?.logTimeStart && searchCriteria?.logTimeEnd) {
      mainAndClause.push(
        { log_time: { $gte: new Date(searchCriteria.logTimeStart), $lte: new Date(searchCriteria.logTimeEnd) } }
      );
    } else if (searchCriteria?.logTimeStart) {
      mainAndClause.push(
        { log_time: { $gte: new Date(searchCriteria.logTimeStart) } }
      );
    } else if (searchCriteria?.logTimeEnd) {
      mainAndClause.push({ log_time: { $lte: new Date(searchCriteria.logTimeEnd) } });
    }

    if (searchCriteria?.levels?.length) {
      mainAndClause.push({ level: { $in: searchCriteria.levels } });
    }

    if (searchCriteria?.loggerName) {
      mainAndClause.push({ logger_name: searchCriteria.loggerName });
    }

    if (searchCriteria?.searchKeyword) {
      // message, err_stack, class_name, method_name
      const messageCheck = { message: { $regex: `.*${searchCriteria.searchKeyword}.*` } };
      const errStackCheck = { err_stack: { $regex: `.*${searchCriteria.searchKeyword}.*` } };
      const classNameCheck = { class_name: { $regex: `.*${searchCriteria.searchKeyword}.*` } };
      const methodNameCheck = { method_name: { $regex: `.*${searchCriteria.searchKeyword}.*` } };

      const orClause = [
        messageCheck,
        errStackCheck,
        classNameCheck,
        methodNameCheck,
      ];
      mainAndClause.push({ $or: orClause });
    }

    if (mainAndClause.length) {
      filter["$and"] = mainAndClause;
    }
    return filter;
  }
}
