import { generateRandomId } from "../utils/helper.util";
import KafkaConfig from "../configs/kafka.config";
import { Response } from "express";
import QLogController from "../controllers/qlog.controller";
import AllQLogAppsController from "../controllers/all-qlog-apps.controller";
import { KafkaMessage } from "kafkajs";

export default class KafkaConsumer {
  private static _instance: KafkaConsumer;
  private _allQLogAppsController: AllQLogAppsController;
  private _qlogController: QLogController;
  private _subscribedTopics: string[];

  private constructor() {
    this._allQLogAppsController = AllQLogAppsController.getInstance();
    this._qlogController = QLogController.getInstance();
    this._subscribedTopics = [];
  }

  public static getInstance(): KafkaConsumer {
    if (!KafkaConsumer._instance) {
      KafkaConsumer._instance = new KafkaConsumer();
    }

    return KafkaConsumer._instance;
  }

  public async subscribeAllTopics(): Promise<void> {
    console.log("Subscribing all topics");
    const topics = await this.getAllTopics();
    const newTopicsToSubscribe: string[] = [];
    topics.forEach((x) => {
      if (!this._subscribedTopics.includes(x)) {
        newTopicsToSubscribe.push(x);
      }
    });
    if (newTopicsToSubscribe?.length) {
      await KafkaConfig.getConsumer().stop();
      console.log("New topics to subscribe: ", newTopicsToSubscribe?.length);
      await KafkaConfig.getConsumer().subscribe({
        topics: newTopicsToSubscribe,
        fromBeginning: true,
      });
      this._subscribedTopics = [
        ...this._subscribedTopics,
        ...newTopicsToSubscribe,
      ];
      await this.startConsumingMessages();
    }
  }

  private async getAllTopics(): Promise<string[]> {
    console.log("Getting all topics");
    let topics = await KafkaConfig.getClient().admin().listTopics();
    topics = topics?.filter((x) => x.startsWith("qlog-"));
    if (topics?.length) {
      console.log("New topics to add: ", topics.length);
      await this._allQLogAppsController.upsertKafkaTopics(topics);
    }
    return topics;
  }

  private async startConsumingMessages(): Promise<void> {
    await KafkaConfig.getConsumer().run({
      autoCommit: true,
      eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
        this.handleSingleMessage(message, topic);
      },
    });
  }

  private handleSingleMessage(message: KafkaMessage, topic: string) {
    if (message?.value) {
      console.log("Message received from topic: ", topic);
      const log = JSON.parse(message.value.toString());
      console.log(log);
      this._qlogController.insertLog(topic, log);
    }
  }

  public async streamMessage(topicName: string, res: Response): Promise<void> {
    if (!this._subscribedTopics.includes(topicName)) {
      return;
    }

    const groupId = "qlog-" + topicName + "-consumer-" + generateRandomId(5);
    const offsets = await KafkaConfig.getClient()
      .admin()
      .fetchTopicOffsets(topicName);
    let startOffset = -1;
    if (offsets && offsets[0]?.offset) {
      startOffset = parseInt(offsets[0].offset) - 100;
    }

    console.log("startOffset: ", startOffset);

    const consumer = KafkaConfig.getClient().consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topics: [topicName], fromBeginning: true });
    consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
        this.handleSingleMessageForStreaming(message, topic, res);
      },
    });

    if (startOffset >= 0) {
      consumer.seek({
        topic: topicName,
        partition: 0,
        offset: startOffset.toString(),
      });
    }

    res.on("close", async () => {
      console.log("===============================================");
      console.log("===============================================");
      console.log("closing subscribed consumer");
      console.log("===============================================");
      console.log("===============================================");
      await consumer.stop();
      await consumer.disconnect();
    });
  }

  private handleSingleMessageForStreaming(
    message: KafkaMessage,
    topic: string,
    res: Response<any, Record<string, any>>
  ) {
    if (message?.value) {
      console.log("Streaming Message received from topic: ", topic);
      const msgStrVal = message.value.toString();
      console.log(msgStrVal);
      res.write(`data: ${msgStrVal}\n\n`);
    }
  }
}
