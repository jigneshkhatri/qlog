import { Document } from "mongodb";
import MongoConfig from "../../src/configs/mongo.config";
import AllQLogApps from "../../src/entities/all-qlog-apps.entity";
import AllQLogAppsRepository from "../../src/repositories/all-qlog-apps.repository";
import { convertEntityToMongoData } from "../../src/utils/db-entity.util";
import { initInMemoryMongo } from "../utils/inmemory-mongo.config";
import MongoCollectionName from "../../src/constants/mongo-collection-name.constant";

const insertTestData = async (allAppsTestData: AllQLogApps[]) => {
  const collectionName = MongoCollectionName.allQLogApps;
  const collection = MongoConfig.getDatabase().collection(collectionName);
  await collection.insertMany(
    convertEntityToMongoData(AllQLogApps, allAppsTestData) as Document[]
  );
};

describe("AllQLogAppsRepository should", () => {
  let allQLogAppsRepository: AllQLogAppsRepository;
  const allAppsTestData: AllQLogApps[] = [];

  beforeAll(async () => {
    await initInMemoryMongo();
    for (var i = 0; i < 10; i++) {
      const obj = new AllQLogApps();
      obj.appName = "test" + i;
      obj.kafkaTopicName = "qlog-" + obj.appName;
      allAppsTestData.push(obj);
    }

    allQLogAppsRepository = AllQLogAppsRepository.getInstance();
  });

  afterEach(async () => {
    await MongoConfig.getDatabase().dropCollection(
      MongoCollectionName.allQLogApps
    );
  });

  it("[findAll] Find all the QLog apps", async () => {
    // const collectionName = MongoCollectionName.allQLogApps;
    // const collection = MongoConfig.getDatabase().collection(collectionName);
    // await collection.insertMany(
    //   convertEntityToMongoData(AllQLogApps, allAppsTestData) as Document[]
    // );
    await insertTestData(allAppsTestData);

    const result = await allQLogAppsRepository.findAll();

    expect(result.length).toBe(10);
    expect(result[0].kafkaTopicName).toBe("qlog-test0");
  });

  it("[findAll] Return zero QLog apps if there are no apps yet", async () => {
    const result = await allQLogAppsRepository.findAll();

    expect(result.length).toBe(0);
  });

  it("[upsertApps] Upsert apps", async () => {
    // const collectionName = MongoCollectionName.allQLogApps;
    // const collection = MongoConfig.getDatabase().collection(collectionName);
    // await collection.insertMany(
    //   convertEntityToMongoData(AllQLogApps, allAppsTestData) as Document[]
    // );

    await insertTestData(allAppsTestData);

    const appsToUpsert: AllQLogApps[] = [
      {
        appName: "test0",
        kafkaTopicName: "qlog-test001",
      },
      {
        appName: "test101",
        kafkaTopicName: "qlog-test101",
      },
    ] as AllQLogApps[];

    await allQLogAppsRepository.upsertApps(appsToUpsert);

    const allApps = await allQLogAppsRepository.findAll();

    expect(allApps.length).toBe(11);
    expect(allApps.find((x) => x.appName === "test0")?.kafkaTopicName).toBe(
      "qlog-test0"
    );
  });

  it("[findById] Find app for valid app id", async () => {
    await insertTestData(allAppsTestData);
    const allQLogApps = await allQLogAppsRepository.findAll();
    const id = allQLogApps[0].id;
    const qLogApp = await allQLogAppsRepository.findById(id);

    expect(qLogApp).toBeDefined();
    expect(qLogApp?.id).toBe(id);
    expect(qLogApp?.appName).toBe(allQLogApps[0].appName);
  });

  it("[findById] Return undefined for app id that does not exist", async () => {
    const id = '66dc6020e40982a8bdf7974e';
    await insertTestData(allAppsTestData);
    const qLogApp = await allQLogAppsRepository.findById(id);

    expect(qLogApp).toBeUndefined();
  });
});
