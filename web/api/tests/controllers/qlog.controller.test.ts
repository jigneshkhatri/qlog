import KafkaConfig from "../../src/configs/kafka.config";
import AllQLogAppsController from "../../src/controllers/all-qlog-apps.controller";
import QLogController from "../../src/controllers/qlog.controller";
import QLogSearchDTO from "../../src/dtos/qlog-search.dto";
import AllQLogApps from "../../src/entities/all-qlog-apps.entity";
import QLog from "../../src/entities/qlog.entity";
import QLogRepository from "../../src/repositories/qlog.repository";

describe("QLogController should", () => {
  // the instance of class that need to be tested
  let controller: QLogController;

  // test data
  const qLogApps: AllQLogApps[] = [];
  const logs: QLog[] = [];

  // dependencies that need to be mocked
  let mockedQLogRepository: QLogRepository;
  let mockedAllQLogAppsController: AllQLogAppsController;

  beforeAll(async () => {
    // mock QLog repository
    mockedQLogRepository = {
      insertLog: jest.fn(async () => {}),
      archiveLogs: jest.fn(async () => {}),
      purgeArchivedLogs: jest.fn(async () => {}),
      search: jest.fn(async () => {})
    } as unknown as QLogRepository;
    jest
      .spyOn(QLogRepository, "getInstance")
      .mockReturnValue(mockedQLogRepository);

    // mock QLog apps controller
    mockedAllQLogAppsController = {
      findAll: jest.fn(async () => {}),
      findById: jest.fn(async () => {}),
    } as unknown as AllQLogAppsController;
    jest
      .spyOn(AllQLogAppsController, "getInstance")
      .mockReturnValue(mockedAllQLogAppsController);
    

    // prepare test data
    for (var i = 1; i <= 5; i++) {
      const appName = "app-" + i;
      const singleApp = {
        id: "id-" + i,
        appName,
        kafkaTopicName: "qlog-" + appName,
      } as AllQLogApps;
      qLogApps.push(singleApp);
    }

    for (var i = 31; i >= 1; i--) {
      const log = {
        loggerName: "test-" + i,
        createdOn: new Date(2023, 7, i, 0, 0, 0, 0),
      } as QLog;
      logs.push(log);
    }

    controller = QLogController.getInstance();
  });

  beforeEach(() => {
    // clear the mocked results for a fresh start for each test case
    jest.clearAllMocks();
  });

  it("[insertLog] Insert single log for valid topic", async () => {
    const topicName = "test";
    await controller.insertLog(topicName, { loggerName: "test" } as QLog);
    expect(mockedQLogRepository.insertLog).toHaveBeenCalledTimes(1);
  });

  it("[insertLog] Do not insert log for undefined topic or log", async () => {
    await controller.insertLog("", { loggerName: "test" } as QLog);
    // await controller.insertLog('test', new QLog());
    await controller.insertLog("", new QLog());
    expect(mockedQLogRepository.insertLog).toHaveBeenCalledTimes(0);
  });

  it("[archiveLogs] Archive old logs", async () => {
    // const allQLogApps = [{ kafkaTopicName: "abc" }, { kafkaTopicName: "xyz" }];
    jest
      .spyOn(mockedAllQLogAppsController, "findAll")
      .mockResolvedValue(qLogApps as AllQLogApps[]);
    await controller.archiveLogs();

    expect(mockedQLogRepository.archiveLogs).toHaveBeenCalledTimes(qLogApps.length);
  });

  it("[archiveLogs] Do not archive any logs as there are no apps", async () => {
    jest
      .spyOn(mockedAllQLogAppsController, "findAll")
      .mockResolvedValue([] as AllQLogApps[]);
    await controller.archiveLogs();

    expect(mockedQLogRepository.archiveLogs).toHaveBeenCalledTimes(0);
  });

  it("[purgeArchivedLogs] Purge archived logs", async () => {
    // const allQLogApps = [{ kafkaTopicName: "abc" }, { kafkaTopicName: "xyz" }];
    jest
      .spyOn(mockedAllQLogAppsController, "findAll")
      .mockResolvedValue(qLogApps as AllQLogApps[]);
    await controller.purgeArchivedLogs();

    expect(mockedQLogRepository.purgeArchivedLogs).toHaveBeenCalledTimes(qLogApps.length);
  });

  it("[purgeArchivedLogs] Do not purge any logs as there are no apps", async () => {
    jest
      .spyOn(mockedAllQLogAppsController, "findAll")
      .mockResolvedValue([] as AllQLogApps[]);
    await controller.purgeArchivedLogs();

    expect(mockedQLogRepository.purgeArchivedLogs).toHaveBeenCalledTimes(0);
  });

  it.skip("[stream] Stream logs for given app name", async () => {

  });

  it.skip("[stream] Throw exception if invalid app name is passed for streaming logs", async () => {

  });

  it("[search] Search the logs for particular app as per search criteria", async () => {
    // case 1: logs found

    // prepare test data
    const appId = "66dc6020e40982a8bdf7974e";
    const searchCriteria = new QLogSearchDTO();
    const lastCreatedOn = "2024-09-10T00:00:00.000Z";

    // mock external methods
    jest
      .spyOn(mockedAllQLogAppsController, "findById")
      .mockResolvedValue(qLogApps[0] as AllQLogApps);

    jest
      .spyOn(mockedQLogRepository, "search")
      .mockResolvedValue(logs as QLog[]);

    // execute
    const response = await controller.search(
      appId,
      searchCriteria,
      lastCreatedOn
    );

    // validate
    expect(response).toBeDefined();
    expect(response.logs).toBe(logs);
    expect(response.lastCreatedOn).toBe(
      logs[logs.length - 1].createdOn.toISOString()
    );
  });

  it("[search] Return empty logs when no logs are found as per search criteria", async () => {
    // case 2: no logs found

    // prepare test data
    const appId = "66dc6020e40982a8bdf7974e";
    const searchCriteria = new QLogSearchDTO();
    const lastCreatedOn = "2024-09-10T00:00:00.000Z";

    // mock external methods
    jest
      .spyOn(mockedAllQLogAppsController, "findById")
      .mockResolvedValue(qLogApps[0] as AllQLogApps);

    jest.spyOn(mockedQLogRepository, "search").mockResolvedValue([] as QLog[]);

    // execute
    const response = await controller.search(
      appId,
      searchCriteria,
      lastCreatedOn
    );

    // validate
    expect(response).toBeDefined();
    expect(response.logs).toHaveLength(0);
    expect(response.lastCreatedOn).toBe(lastCreatedOn);
  });
});
