import { MongoMemoryReplSet } from "mongodb-memory-server";
import MongoConfig from "../../src/configs/mongo.config";

export const initInMemoryMongo = async () => {
    const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); // This will create an ReplSet with 4 members
    await MongoConfig.connect(replSet.getUri());
    return replSet;
};