import QLogRepository from "../../src/repositories/qlog.repository";
import MongoConfig from "../../src/configs/mongo.config";
import { initInMemoryMongo } from "../utils/inmemory-mongo.config";
import {
  convertEntityToMongoData,
  convertMongoDataToEntity,
} from "../../src/utils/db-entity.util";
import QLog from "../../src/entities/qlog.entity";
import { Collection, Document } from "mongodb";
import QLogSearchDTO from "../../src/dtos/qlog-search.dto";
import { getUTCDate } from "../../src/utils/helper.util";

describe("QLogRepository should", () => {
  // the instance of class that need to be tested
  let repository: QLogRepository;

  // test data
  const logs: QLog[] = [];
  const archivedLogs: QLog[] = [];

  beforeAll(async () => {
    // Initialize in memory mongo db for testing
    await initInMemoryMongo();

    // prepare test data
    for (var i = 1; i <= 31; i++) {
      const message = i % 2 === 0 ? "even" : "odd";
      const level = i % 2 === 0 ? "INFO" : "ERROR";
      const log = {
        loggerName: "test" + i,
        message,
        level,
        logTime: getUTCDate(2023, 8, i, 0, 0, 0, 0),
        createdOn: getUTCDate(2023, 8, i, 0, 0, 0, 0),
      } as QLog;
      logs.push(log);
    }

    for (var i = 1; i <= 31; i++) {
      const message = i % 2 === 0 ? "even" : "odd";
      const level = i % 2 === 0 ? "INFO" : "ERROR";
      const log = {
        loggerName: "test" + i,
        message,
        level,
        logTime: getUTCDate(2023, 4, i, 0, 0, 0, 0),
        createdOn: getUTCDate(2023, 4, i, 0, 0, 0, 0),
      } as QLog;
      archivedLogs.push(log);
    }

    // initialize class that need to be tested
    repository = QLogRepository.getInstance();
  });

  beforeEach(() => {
    // restore all mocks. We are using real in-memory mongodb database,
    // thus not mocking dependencies for each test case (just mocked for few specific cases).
    // Thus, we need to restore (not clear) the mocks before execution of each test case
    // so that test case can again use real in-memory mongodb database and the mocks are removed
    // if the previous test case has mocked any dependency.
    jest.restoreAllMocks();
  });
  // after each test case cleanup tasks
  afterEach(async () => {
    // drop all collections
    (await MongoConfig.getDatabase().listCollections().toArray()).forEach(
      async (c) => await MongoConfig.getDatabase().dropCollection(c.name)
    );
  });

  it("[insertLog] Insert single log", async () => {
    // preparation
    const topicName = "testCollection";
    const collection = MongoConfig.getDatabase().collection(topicName);

    // trigger action to test
    await repository.insertLog(topicName, logs[0]);

    // prepare verification data
    const cnt = await collection.countDocuments({});
    const docs = convertMongoDataToEntity(
      await collection.find({}).toArray(),
      QLog
    ) as QLog[];

    // verification
    expect(cnt).toBe(1);
    expect(docs[0].loggerName).toBe("test1");
    expect(docs[0].createdOn).toStrictEqual(getUTCDate(2023, 8, 1, 0, 0, 0, 0));
  });

  it("[archiveLogs] Archive zero logs if they are out of threshold", async () => {
    // preparation
    const topicName = "testCollection";
    const targetTopicName = topicName + "-archived";
    const thresholdDate = getUTCDate(2023, 7, 11, 0, 0, 0, 0);
    const batchSize = 5;
    const sourceCollection = MongoConfig.getDatabase().collection(topicName);
    const targetCollection =
      MongoConfig.getDatabase().collection(targetTopicName);

    // insert logs as test data
    await sourceCollection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    // trigger action to test
    await repository.archiveLogs(topicName, thresholdDate, batchSize);

    // prepare verification data
    const sourceCnt = await sourceCollection.countDocuments({});
    const sourceDocs = convertMongoDataToEntity(
      await sourceCollection.find({}).sort({ created_on: 1 }).toArray(),
      QLog
    ) as QLog[];
    const targetCnt = await targetCollection.countDocuments({});

    // verification
    expect(sourceCnt).toBe(31);
    expect(targetCnt).toBe(0);
    expect(sourceDocs[0].createdOn).toStrictEqual(
      getUTCDate(2023, 8, 1, 0, 0, 0, 0)
    );
  });

  it("[archiveLogs] Archive old logs within threshold", async () => {
    // preparation
    const topicName = "testCollection";
    const targetTopicName = topicName + "-archived";
    const thresholdDate = getUTCDate(2023, 8, 11, 0, 0, 0, 0);
    const batchSize = 5;
    const sourceCollection = MongoConfig.getDatabase().collection(topicName);
    const targetCollection =
      MongoConfig.getDatabase().collection(targetTopicName);

    // insert logs as test data
    await sourceCollection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    // trigger action to test
    await repository.archiveLogs(topicName, thresholdDate, batchSize);

    // prepare verification data
    const sourceCnt = await sourceCollection.countDocuments({});
    const sourceDocs = convertMongoDataToEntity(
      await sourceCollection.find({}).sort({ created_on: 1 }).toArray(),
      QLog
    ) as QLog[];
    const targetCnt = await targetCollection.countDocuments({});
    const targetDocs = convertMongoDataToEntity(
      await targetCollection.find({}).sort({ created_on: 1 }).toArray(),
      QLog
    ) as QLog[];

    // verification
    expect(sourceCnt).toBe(21);
    expect(targetCnt).toBe(10);
    expect(sourceDocs[0].createdOn).toStrictEqual(
      getUTCDate(2023, 8, 11, 0, 0, 0, 0)
    );
    expect(targetDocs[targetCnt - 1].createdOn).toStrictEqual(
      getUTCDate(2023, 8, 10, 0, 0, 0, 0)
    );
  });

  it("[archiveLogs] Rollback transaction if any error occurrs while archiving old logs", async () => {
    // preparation
    const topicName = "testCollection2";
    const targetTopicName = topicName + "-archived";
    const thresholdDate = getUTCDate(2023, 8, 11, 0, 0, 0, 0);
    const batchSize = 5;
    const sourceCollection = MongoConfig.getDatabase().collection(topicName);
    const targetCollection =
      MongoConfig.getDatabase().collection(targetTopicName);

    // spy on collections, so that we can mock deleteMany method of collection
    // so that error can be thrown by this method and transaction can be rolled back
    jest
      .spyOn(MongoConfig.getDatabase(), "collection")
      .mockImplementation((collectionName: string) => {
        if (collectionName === topicName) return sourceCollection;
        else if (collectionName === targetTopicName) return targetCollection;
        else throw new Error("Invalid collection name");
      });
    jest.spyOn(sourceCollection, "deleteMany").mockImplementation(() => {
      throw Error("Error occurred while deleting docs");
    });

    // insert logs as test data
    await sourceCollection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    // trigger action to test
    await repository.archiveLogs(topicName, thresholdDate, batchSize);

    // prepare verification data
    const sourceCnt = await sourceCollection.countDocuments({});
    const sourceDocs = convertMongoDataToEntity(
      await sourceCollection.find({}).sort({ created_on: 1 }).toArray(),
      QLog
    ) as QLog[];
    const targetCnt = await targetCollection.countDocuments({});

    // verification
    expect(sourceCnt).toBe(31);
    expect(targetCnt).toBe(0);
    expect(sourceDocs[0].createdOn).toStrictEqual(
      getUTCDate(2023, 8, 1, 0, 0, 0, 0)
    );
  });

  it("[purgeArchivedLogs] Purge zero logs if they are out of threshold", async () => {
    // preparation
    const topicName = "testCollection";
    const thresholdDate = getUTCDate(2023, 7, 11, 0, 0, 0, 0);
    const sourceCollection = MongoConfig.getDatabase().collection(
      topicName + "-archived"
    );

    // insert logs as test data
    await sourceCollection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    // trigger action to test
    await repository.purgeArchivedLogs(topicName, thresholdDate);

    // prepare verification data
    const sourceCnt = await sourceCollection.countDocuments({});
    const sourceDocs = convertMongoDataToEntity(
      await sourceCollection.find({}).sort({ created_on: 1 }).toArray(),
      QLog
    ) as QLog[];

    // verification
    expect(sourceCnt).toBe(31);
    expect(sourceDocs[0].createdOn).toStrictEqual(
      getUTCDate(2023, 8, 1, 0, 0, 0, 0)
    );
  });

  it("[purgeArchivedLogs] Purge old archived logs within threshold", async () => {
    // preparation
    const topicName = "testCollection";
    const thresholdDate = getUTCDate(2023, 8, 11, 0, 0, 0, 0);
    const sourceCollection = MongoConfig.getDatabase().collection(
      topicName + "-archived"
    );

    // insert logs as test data
    await sourceCollection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    // trigger action to test
    await repository.purgeArchivedLogs(topicName, thresholdDate);

    // prepare verification data
    const sourceCnt = await sourceCollection.countDocuments({});
    const sourceDocs = convertMongoDataToEntity(
      await sourceCollection.find({}).sort({ created_on: 1 }).toArray(),
      QLog
    ) as QLog[];

    // verification
    expect(sourceCnt).toBe(21);
    expect(sourceDocs[0].createdOn).toStrictEqual(
      getUTCDate(2023, 8, 11, 0, 0, 0, 0)
    );
  });

  it("[search] Return top n logs from main collection if no search criteria is passed", async () => {
    // preparation
    const collectionName = "mainApp1";
    const collection = MongoConfig.getDatabase().collection(collectionName);
    await collection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    // execute
    const response1 = await repository.search(
      collectionName,
      new QLogSearchDTO(),
      undefined
    );
    const lastCreatedOn =
      response1[response1.length - 1].createdOn.toISOString();
    const response2 = await repository.search(
      collectionName,
      new QLogSearchDTO(),
      lastCreatedOn
    );

    // verification
    expect(response1).toHaveLength(20);
    let i = 31;
    response1.forEach((single) => {
      expect(single.loggerName).toBe("test" + i--);
    });

    expect(response2).toHaveLength(11);
    response2.forEach((single) => {
      expect(single.loggerName).toBe("test" + i--);
    });
  });

  it.each([
    // searchKeyword
    {
      caseNo: 1,
      searchCriteria: { searchKeyword: "even" } as QLogSearchDTO,
      expected: {
        count: 15,
        firstCreatedOn: "2023-08-30T00:00:00.000Z",
        lastCreatedOn: "2023-08-02T00:00:00.000Z",
      },
    },

    // logTimeStart [25 to 31] = 7 days
    {
      caseNo: 2,
      searchCriteria: {
        logTimeStart: "2023-08-25T00:00:00.000Z",
      } as QLogSearchDTO,
      expected: {
        count: 7,
        firstCreatedOn: "2023-08-31T00:00:00.000Z",
        lastCreatedOn: "2023-08-25T00:00:00.000Z",
      },
    },

    // logTimeEnd [01 to 05] = 5 days
    {
      caseNo: 3,
      searchCriteria: {
        logTimeEnd: "2023-08-05T00:00:00.000Z",
      } as QLogSearchDTO,
      expected: {
        count: 5,
        firstCreatedOn: "2023-08-05T00:00:00.000Z",
        lastCreatedOn: "2023-08-01T00:00:00.000Z",
      },
    },

    // levels
    {
      caseNo: 4,
      searchCriteria: { levels: ["ERROR"] } as QLogSearchDTO,
      expected: {
        count: 16,
        firstCreatedOn: "2023-08-31T00:00:00.000Z",
        lastCreatedOn: "2023-08-01T00:00:00.000Z",
      },
    },

    // loggerName
    {
      caseNo: 5,
      searchCriteria: { loggerName: "test1" } as QLogSearchDTO,
      expected: {
        count: 1,
        firstCreatedOn: "2023-08-01T00:00:00.000Z",
        lastCreatedOn: "2023-08-01T00:00:00.000Z",
      },
    },

    // all 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
    {
      caseNo: 6,
      searchCriteria: {
        searchKeyword: "odd",
        logTimeStart: "2023-08-01T00:00:00.000Z",
        logTimeEnd: "2023-08-20T00:00:00.000Z",
        levels: ["ERROR"],
        loggerName: "test1",
      } as QLogSearchDTO,
      lastCreatedOn: undefined,
      expected: {
        count: 1,
        firstCreatedOn: "2023-08-01T00:00:00.000Z",
        lastCreatedOn: "2023-08-01T00:00:00.000Z",
      },
    },
  ])(
    "[search] Return top n logs from main collection if search criteria is passed - case #$caseNo",
    async ({ searchCriteria, expected }) => {
      // preparation
      const collectionName = "mainApp2";
      const collection = MongoConfig.getDatabase().collection(collectionName);
      await collection.insertMany(
        convertEntityToMongoData(QLog, logs) as Document[]
      );

      // execute
      await testSearchLogs(
        collection,
        undefined,
        searchCriteria,
        expected,
      );
    }
  );

  it("[search] Return top n logs from main and archived collection if no search criteria is passed", async () => {
    // preparation
    const collectionName = "mainApp3";
    const collection = MongoConfig.getDatabase().collection(collectionName);
    await collection.insertMany(
      convertEntityToMongoData(QLog, logs) as Document[]
    );

    const archivedCollectionName = collectionName + "-archived";
    const archivedCollection = MongoConfig.getDatabase().collection(
      archivedCollectionName
    );
    await archivedCollection.insertMany(
      convertEntityToMongoData(QLog, archivedLogs) as Document[]
    );

    // execute
    const response1 = await repository.search(
      collectionName,
      new QLogSearchDTO(),
      undefined
    );
    const lastCreatedOn =
      response1[response1.length - 1].createdOn.toISOString();
    const response2 = await repository.search(
      collectionName,
      new QLogSearchDTO(),
      lastCreatedOn
    );

    // verification
    expect(response1).toHaveLength(20);
    let i = 31;
    response1.forEach((single) => {
      expect(single.loggerName).toBe("test" + i--);
    });

    expect(response2).toHaveLength(20);
    response2.forEach((single) => {
      if (i === 0) i = 31;
      expect(single.loggerName).toBe("test" + i--);
    });
  });

  it.each([
    // searchKeyword
    {
      caseNo: 1,
      searchCriteria: { searchKeyword: "even" } as QLogSearchDTO,
      expected: {
        count: 30,
        firstCreatedOn: "2023-08-30T00:00:00.000Z",
        lastCreatedOn: "2023-04-02T00:00:00.000Z",
      },
    },

    // logTimeStart [25 to 31 April], [01 to 31 Aug] = 7 + 31 = 38 days
    {
      caseNo: 2,
      searchCriteria: {
        logTimeStart: "2023-04-25T00:00:00.000Z",
      } as QLogSearchDTO,
      expected: {
        count: 38,
        firstCreatedOn: "2023-08-31T00:00:00.000Z",
        lastCreatedOn: "2023-04-25T00:00:00.000Z",
      },
    },

    // logTimeEnd [01 to 31 April], [01 to 05 Aug] = 31 + 5 = 36 days
    {
      caseNo: 3,
      searchCriteria: {
        logTimeEnd: "2023-08-05T00:00:00.000Z",
      } as QLogSearchDTO,
      expected: {
        count: 36,
        firstCreatedOn: "2023-08-05T00:00:00.000Z",
        lastCreatedOn: "2023-04-01T00:00:00.000Z",
      },
    },

    // levels
    {
      caseNo: 4,
      searchCriteria: { levels: ["ERROR"] } as QLogSearchDTO,
      expected: {
        count: 32,
        firstCreatedOn: "2023-08-31T00:00:00.000Z",
        lastCreatedOn: "2023-04-01T00:00:00.000Z",
      },
    },

    // loggerName
    {
      caseNo: 5,
      searchCriteria: { loggerName: "test1" } as QLogSearchDTO,
      expected: {
        count: 2,
        firstCreatedOn: "2023-08-01T00:00:00.000Z",
        lastCreatedOn: "2023-04-01T00:00:00.000Z",
      },
    },

    // all 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
    {
      caseNo: 6,
      searchCriteria: {
        searchKeyword: "odd",
        logTimeStart: "2023-04-01T00:00:00.000Z",
        logTimeEnd: "2023-08-20T00:00:00.000Z",
        levels: ["ERROR"],
        loggerName: "test1",
      } as QLogSearchDTO,
      expected: {
        count: 2,
        firstCreatedOn: "2023-08-01T00:00:00.000Z",
        lastCreatedOn: "2023-04-01T00:00:00.000Z",
      },
    },
  ])(
    "[search] Return top n logs from main and archived collection if search criteria is passed - case #$caseNo",
    async ({ searchCriteria, expected }) => {
      // preparation
      const collectionName = "mainApp4";
      const collection = MongoConfig.getDatabase().collection(collectionName);
      await collection.insertMany(
        convertEntityToMongoData(QLog, logs) as Document[]
      );

      const archivedCollectionName = collectionName + "-archived";
      const archivedCollection = MongoConfig.getDatabase().collection(
        archivedCollectionName
      );
      await archivedCollection.insertMany(
        convertEntityToMongoData(QLog, archivedLogs) as Document[]
      );

      // execute
      await testSearchLogs(
        collection,
        archivedCollection,
        searchCriteria,
        expected,
      );
    }
  );

  it("Return zero logs from main and archived collection if no logs match for search criteria are present", async () => {});

  const testSearchLogs = async (
    collection: Collection,
    archivedCollection: Collection | undefined,
    searchCriteria: QLogSearchDTO,
    expected: { count: number; firstCreatedOn: string; lastCreatedOn: string }
  ) => {
    let lastCreatedOn: string | undefined = undefined;

    let data: QLog[] = [];

    // execute
    let singleResponse: QLog[] = [];
    do {
      singleResponse = await repository.search(
        collection.collectionName,
        searchCriteria,
        lastCreatedOn
      );
      if (singleResponse.length) {
        lastCreatedOn =
          singleResponse[singleResponse.length - 1].createdOn.toISOString();
        data = [...data, ...singleResponse];
      }
    } while (singleResponse.length);

    // verification
    expect(data).toHaveLength(expected.count);
    expect(data[0].createdOn.toISOString()).toBe(expected.firstCreatedOn);
    expect(data[data.length - 1].createdOn.toISOString()).toBe(
      expected.lastCreatedOn
    );

    // clean up
    await collection.drop();
    if (archivedCollection) {
      await archivedCollection.drop();
    }
  };
});
