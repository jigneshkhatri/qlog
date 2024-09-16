import { Admin, Consumer, ConsumerRunConfig, Kafka } from "kafkajs";
import KafkaConfig from "../../src/configs/kafka.config";
import AllQLogAppsController from "../../src/controllers/all-qlog-apps.controller";
import QLogController from "../../src/controllers/qlog.controller";
import KafkaConsumer from "../../src/kafka-consumers/kafka-consumer";
import express from "express";

describe("KafkaConsumer should", () => {
  // the instance of class that need to be tested
  let kafkaConsumer: KafkaConsumer;

  // dependencies that need to be mocked
  let mockedQLogController: QLogController;
  let mockedAllQLogAppsController: AllQLogAppsController;

  beforeAll(async () => {
    // mock QLog apps controller
    mockedQLogController = {
      insertLog: jest.fn(async () => {}),
    } as unknown as QLogController;
    jest
      .spyOn(QLogController, "getInstance")
      .mockReturnValue(mockedQLogController);

    mockedAllQLogAppsController = {
      upsertKafkaTopics: jest.fn(async () => {}),
    } as unknown as AllQLogAppsController;
    jest
      .spyOn(AllQLogAppsController, "getInstance")
      .mockReturnValue(mockedAllQLogAppsController);

    const mockedKafkaConsumer = {
      connect: jest.fn(async () => {}),
      subscribe: jest.fn(async () => {}),
      run: jest.fn(async () => {}),
      seek: jest.fn(async () => {}),
      stop: jest.fn(async () => {}),
      disconnect: jest.fn(async () => {}),
    } as unknown as Consumer;
    jest.spyOn(KafkaConfig, "getConsumer").mockReturnValue(mockedKafkaConsumer);

    const mockedKafkaAdmin = {
      listTopics: jest.fn(async () => {}),
      fetchTopicOffsets: jest.fn(async () => {}),
    } as unknown as Admin;

    const mockedKafkaClient = {
      admin: jest.fn(() => mockedKafkaAdmin),
      consumer: jest.fn(() => mockedKafkaConsumer),
    } as unknown as Kafka;
    jest.spyOn(KafkaConfig, "getClient").mockReturnValue(mockedKafkaClient);

    kafkaConsumer = KafkaConsumer.getInstance();
  });

  beforeEach(() => {
    // clear the mocked results for a fresh start for each test case
    jest.clearAllMocks();
  });

  it("[subscribeAllTopics] Not subscribe to any topics when there are no topics in Kafka", async () => {
    jest
      .spyOn(KafkaConfig.getClient().admin(), "listTopics")
      .mockResolvedValue([]);

    // execute
    await kafkaConsumer.subscribeAllTopics();

    expect(mockedAllQLogAppsController.upsertKafkaTopics).toHaveBeenCalledTimes(
      0
    );
    expect(KafkaConfig.getConsumer).toHaveBeenCalledTimes(0);
  });

  it('[subscribeAllTopics] Subscribe to topics starting with "qlog-"', async () => {
    const topics = ["test", "abcd", "qlog-test", "qlog-abcd"];
    jest
      .spyOn(KafkaConfig.getClient().admin(), "listTopics")
      .mockResolvedValue(topics);

    // execute
    await kafkaConsumer.subscribeAllTopics();

    // execute dummy consumer's eachMessage method to mock the
    // consumer received message behavior
    const consumerRunArg: ConsumerRunConfig = (
      KafkaConfig.getConsumer().run as jest.Mock
    ).mock.calls[0][0];
    topics.forEach((singleTopic) => {
      if (!singleTopic.includes("qlog-")) return;

      for (var i = 0; i < 2; i++) {
        consumerRunArg.eachMessage?.call(consumerRunArg, {
          topic: singleTopic,
          partition: 0,
          message: {
            key: Buffer.from("key"),
            value: Buffer.from(`{"test": "test${i}"}`),
            headers: {},
            timestamp: "",
            attributes: 0,
            offset: "",
          },
          heartbeat: async () => {},
          pause: () => () => {},
        });
      }
    });

    // verifications
    expect(mockedAllQLogAppsController.upsertKafkaTopics).toHaveBeenCalledTimes(
      1
    );
    const upsertKafkaTopicsArg = (
      mockedAllQLogAppsController.upsertKafkaTopics as jest.Mock
    ).mock.calls[0][0];
    expect(upsertKafkaTopicsArg.length).toBe(2);
    expect(
      upsertKafkaTopicsArg.filter((x: string) => x.includes("qlog-")).length
    ).toBe(2);
    expect(upsertKafkaTopicsArg.findIndex((x: string) => x === "test")).toBe(
      -1
    );
    expect(KafkaConfig.getConsumer().stop).toHaveBeenCalledTimes(1);
    expect(KafkaConfig.getConsumer().subscribe).toHaveBeenCalledTimes(1);
    expect(KafkaConfig.getConsumer().run).toHaveBeenCalledTimes(1);
    expect(mockedQLogController.insertLog).toHaveBeenCalledTimes(4);
    const insertLogCalls = (mockedQLogController.insertLog as jest.Mock).mock
      .calls;

    const topicName0 = insertLogCalls[0][0];
    const log0 = insertLogCalls[0][1];
    expect(topicName0).toBe("qlog-test");
    expect(log0.test).toBe("test0");

    const topicName1 = insertLogCalls[1][0];
    const log1 = insertLogCalls[1][1];
    expect(topicName1).toBe("qlog-test");
    expect(log1.test).toBe("test1");

    const topicName2 = insertLogCalls[2][0];
    const log2 = insertLogCalls[2][1];
    expect(topicName2).toBe("qlog-abcd");
    expect(log2.test).toBe("test0");

    const topicName3 = insertLogCalls[3][0];
    const log3 = insertLogCalls[3][1];
    expect(topicName3).toBe("qlog-abcd");
    expect(log3.test).toBe("test1");
  });

  it("[streamMessage] Not stream message if invalid topic name is passed", async () => {
    const res = express.response;

    // execute
    await kafkaConsumer.streamMessage("test", res);

    // verification
    expect(KafkaConfig.getClient).toHaveBeenCalledTimes(0);
  });

  it("[streamMessage] Stream message if valid topic name is passed and there are less than 100 messages in topic", async () => {
    const topicName = "qlog-test";
    const res = JSON.parse(JSON.stringify(express.response));
    res.write = jest.fn();
    res.on = express.response.on;
    res.emit = express.response.emit;

    // execute
    await kafkaConsumer.streamMessage(topicName, res);

    // execute dummy consumer's eachMessage method to mock the
    // consumer received message behavior
    const consumerRunArg: ConsumerRunConfig = (
      KafkaConfig.getConsumer().run as jest.Mock
    ).mock.calls[0][0];
    for (var i = 0; i < 2; i++) {
      consumerRunArg.eachMessage?.call(consumerRunArg, {
        topic: topicName,
        partition: 0,
        message: {
          key: Buffer.from("key"),
          value: Buffer.from(`{"test": "test${i}"}`),
          headers: {},
          timestamp: "",
          attributes: 0,
          offset: "",
        },
        heartbeat: async () => {},
        pause: () => () => {},
      });
    }

    // verification
    expect(KafkaConfig.getClient().consumer).toHaveBeenCalledTimes(1);
    const mockedConsumer = (KafkaConfig.getClient().consumer as jest.Mock).mock
      .results[0].value;
    expect(mockedConsumer.connect).toHaveBeenCalledTimes(1);
    expect(mockedConsumer.subscribe).toHaveBeenCalledTimes(1);
    const subscribeArgs = (mockedConsumer.subscribe as jest.Mock).mock
      .calls[0][0];
    expect(subscribeArgs.topics[0]).toBe(topicName);
    expect(mockedConsumer.run).toHaveBeenCalledTimes(1);
    expect(mockedConsumer.seek).toHaveBeenCalledTimes(0);
    expect(res.write).toHaveBeenCalledTimes(2);
    const resWriteCalls = (res.write as jest.Mock).mock.calls;
    expect(resWriteCalls[0][0]).toBe('data: {"test": "test0"}\n\n');
    expect(resWriteCalls[1][0]).toBe('data: {"test": "test1"}\n\n');

    res.emit("close");
    setTimeout(() => {
      expect(mockedConsumer.stop).toHaveBeenCalledTimes(1);
      expect(mockedConsumer.disconnect).toHaveBeenCalledTimes(1);
    }, 100);
  });

  it("[streamMessage] Stream message if valid topic name is passed and there are more than 100 messages in topic", async () => {
    const topicName = "qlog-test";
    const res = JSON.parse(JSON.stringify(express.response));
    res.write = jest.fn();
    res.on = express.response.on;
    res.emit = express.response.emit;

    jest
      .spyOn(KafkaConfig.getClient().admin(), "fetchTopicOffsets")
      .mockResolvedValue([{ offset: "1000", partition: 0, high: '', low: '' }]);

    // execute
    await kafkaConsumer.streamMessage(topicName, res);

    // execute dummy consumer's eachMessage method to mock the
    // consumer received message behavior
    const consumerRunArg: ConsumerRunConfig = (
      KafkaConfig.getConsumer().run as jest.Mock
    ).mock.calls[0][0];
    for (var i = 0; i < 2; i++) {
      consumerRunArg.eachMessage?.call(consumerRunArg, {
        topic: topicName,
        partition: 0,
        message: {
          key: Buffer.from("key"),
          value: Buffer.from(`{"test": "test${i}"}`),
          headers: {},
          timestamp: "",
          attributes: 0,
          offset: "",
        },
        heartbeat: async () => {},
        pause: () => () => {},
      });
    }

    // verification
    expect(KafkaConfig.getClient().consumer).toHaveBeenCalledTimes(1);
    const mockedConsumer = (KafkaConfig.getClient().consumer as jest.Mock).mock
      .results[0].value;
    expect(mockedConsumer.connect).toHaveBeenCalledTimes(1);
    expect(mockedConsumer.subscribe).toHaveBeenCalledTimes(1);
    const subscribeArgs = (mockedConsumer.subscribe as jest.Mock).mock
      .calls[0][0];
    expect(subscribeArgs.topics[0]).toBe(topicName);
    expect(mockedConsumer.run).toHaveBeenCalledTimes(1);
    expect(mockedConsumer.seek).toHaveBeenCalledTimes(1);
    const seekArgs = (mockedConsumer.seek as jest.Mock).mock.calls[0][0];
    expect(seekArgs.topic).toBe(topicName);
    expect(seekArgs.offset).toBe('900');
    expect(res.write).toHaveBeenCalledTimes(2);
    const resWriteCalls = (res.write as jest.Mock).mock.calls;
    expect(resWriteCalls[0][0]).toBe('data: {"test": "test0"}\n\n');
    expect(resWriteCalls[1][0]).toBe('data: {"test": "test1"}\n\n');

    res.emit("close");
    setTimeout(() => {
      expect(mockedConsumer.stop).toHaveBeenCalledTimes(1);
      expect(mockedConsumer.disconnect).toHaveBeenCalledTimes(1);
    }, 100);
  });
});
