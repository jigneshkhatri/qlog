import AllQLogAppsController from "../../src/controllers/all-qlog-apps.controller";
import AllQLogApps from "../../src/entities/all-qlog-apps.entity";
import DataNotFound from "../../src/errors/data-not-found.error";
import RequestValidationError from "../../src/errors/request-validation.error";
import AllQLogAppsRepository from "../../src/repositories/all-qlog-apps.repository";

describe("AllQLogAppsController should", () => {
  let allQLogAppsController: AllQLogAppsController;
  let mockedAllQLogAppsRepository: AllQLogAppsRepository;
  const allAppsTestData: AllQLogApps[] = [];

  beforeAll(() => {
    for (var i = 0; i < 10; i++) {
      const obj = new AllQLogApps();
      obj.id = "id" + i;
      obj.appName = "test" + i;
      obj.kafkaTopicName = "qlog-" + obj.appName;
      allAppsTestData.push(obj);
    }

    mockedAllQLogAppsRepository = {
      findAll: jest.fn(async () => {}),
      upsertApps: jest.fn(async () => {}),
      findById: jest.fn(async () => {}),
    } as unknown as AllQLogAppsRepository;
    jest
      .spyOn(AllQLogAppsRepository, "getInstance")
      .mockReturnValue(mockedAllQLogAppsRepository);

    allQLogAppsController = AllQLogAppsController.getInstance();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it("[findAll] Find all the QLog apps", async () => {
    jest
      .spyOn(mockedAllQLogAppsRepository, "findAll")
      .mockResolvedValue(allAppsTestData);
    const apps = await allQLogAppsController.findAll();

    expect(apps.length).toBe(10);
  });

  it("[findAll] Return zero values if there are no apps in database", async () => {
    jest.spyOn(mockedAllQLogAppsRepository, "findAll").mockResolvedValue([]);
    const apps = await allQLogAppsController.findAll();

    expect(apps.length).toBe(0);
  });

  it("[upsertKafkaTopics] Insert kafka topics in database if not already inserted", async () => {
    const topics = ["qlog-test0", "qlog-test1", "test2"];

    await allQLogAppsController.upsertKafkaTopics(topics);

    const args = (mockedAllQLogAppsRepository.upsertApps as jest.Mock).mock
      .calls[0][0];
    expect(args.length).toBe(2);
    expect(
      args.findIndex((x: AllQLogApps) => x.kafkaTopicName === "test2")
    ).toBe(-1);
  });

  it("[upsertKafkaTopics] Do not insert any topics in database if there none", async () => {
    const topics: string[] = [];

    await allQLogAppsController.upsertKafkaTopics(topics);

    expect(mockedAllQLogAppsRepository.upsertApps).toHaveBeenCalledTimes(0);
  });

  it("[findById] Find by app name", async () => {
    const testApp = allAppsTestData[0];
    jest.spyOn(mockedAllQLogAppsRepository, "findById").mockResolvedValue(testApp);
    const qLogApp: AllQLogApps = await allQLogAppsController.findById(testApp.id);

    expect(qLogApp.id).toBe(testApp.id);
    expect(qLogApp.appName).toBe(testApp.appName);
    expect(qLogApp.kafkaTopicName).toBe(testApp.kafkaTopicName);
  });

  it("[findById] Throw RequestValidationError if app name is not passed", async () => {
    await expect(allQLogAppsController.findById('')).rejects.toThrow(RequestValidationError);
  });

  it("[findById] Throw DataNotFound if app with given name is not found", async () => {
    jest.spyOn(mockedAllQLogAppsRepository, "findById").mockResolvedValue(undefined);
    await expect(allQLogAppsController.findById('test')).rejects.toThrow(DataNotFound);
  });
});
