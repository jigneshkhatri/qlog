import { ClientSession, Collection, Db, FindCursor, MongoClient } from 'mongodb';
import QLogRepository from '../../src/repositories/qlog.repository';
import MongoConfig from '../../src/configs/mongo.config';
import QLog from '../../src/entities/qlog.entity';

// Mock MongoClient
const mockMongoClientMethods = {
  db: jest.fn(),
  startSession: jest.fn()
};
const mockMongoClientInstance = (mockMongoClientMethods as unknown) as MongoClient;

// Mock Mongo Db
const mockDbMethods = {
  collection: jest.fn(),
};
const mockDbInstance = (mockDbMethods as unknown) as Db;

// Mock MongoClient session methods
const mockMongoClientSessionMethods = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(async () => {}),
  abortTransaction: jest.fn(async () => {}),
  endSession: jest.fn(async () => {})
};
const mockMongoClientSessionInstance = (mockMongoClientSessionMethods as unknown) as ClientSession;

// Mock Collection
const mockCollectionMethods = {
  insertOne: jest.fn(async () => {}),
  countDocuments: jest.fn(async () => {}),
  find: jest.fn(async () => {}),
  insertMany: jest.fn(async () => {}),
  deleteMany: jest.fn(async () => {}), 
};
const mockCollectionInstance = (mockCollectionMethods as unknown) as Collection;

jest.spyOn(MongoConfig, 'getClient').mockReturnValue(mockMongoClientInstance);
jest.spyOn(MongoConfig, 'getDatabase').mockReturnValue(mockDbInstance);

describe('QLog Repository should', () => {
  let repository: QLogRepository = QLogRepository.getInstance();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Insert logs in MongoDB collection', async () => {
    // Arrange
    const collectionName = 'testCollection';
    const dataToSave = { loggerName: 'test' } as QLog;
    const collection = { ...mockCollectionInstance, collectionName } as unknown as Collection;
    jest.spyOn(mockDbInstance, 'collection').mockImplementation((_collectionName: string) => {
      if (_collectionName === collectionName) return collection;
      else throw new Error('Invalid collection name');
    });

    // Act
    await repository.insertLog(collectionName, dataToSave);

    // Assert
    expect(collection.collectionName).toBe(collectionName);
    expect(mockDbMethods.collection).toHaveBeenNthCalledWith(1, collectionName);
    expect(collection.insertOne).toHaveBeenCalledTimes(1);
  });

  it('Archive old logs', async () => {
    const batchSize = 5;
    const sourceCollectionName = 'test';
    const destCollectionName = sourceCollectionName + '-archived';
    const sourceCollection = { ...mockCollectionInstance, sourceCollectionName } as unknown as Collection;
    const destCollection = { ...mockCollectionInstance, destCollectionName } as unknown as Collection;
    jest.spyOn(mockDbInstance, 'collection').mockImplementation((collectionName: string) => {
      if (collectionName === sourceCollectionName) return sourceCollection;
      else if (collectionName === destCollectionName) return destCollection;
      else throw new Error('Invalid collection name');
    });

    const logs = [{_id: 1}, {_id: 2}, {_id: 3}, {_id: 4}, {_id: 5},
      {_id: 6}, {_id: 7}, {_id: 8}, {_id: 9}, {_id: 10}
    ];
    jest.spyOn(mockMongoClientInstance, 'startSession').mockReturnValue(mockMongoClientSessionInstance);
    const countDocumentsMock = jest.spyOn(sourceCollection, 'countDocuments');
    const findMock = jest.spyOn(sourceCollection, 'find');
    let temp = 10;
    for (var i=0 ; i<3 ; i++) {
      countDocumentsMock.mockResolvedValueOnce(temp);
      if (temp > 0) {
        findMock.mockReturnValueOnce(({
          limit: jest.fn().mockReturnThis(),
          toArray: jest.fn().mockResolvedValueOnce(logs.slice(i* temp, 10-(temp-5))),
        }) as unknown as FindCursor);
      }
      temp -= 5;
    }

    await repository.archiveLogs(sourceCollectionName, new Date(), batchSize);
    
    expect(sourceCollection.countDocuments).toHaveBeenCalledTimes(3);
    expect(sourceCollection.find).toHaveBeenCalledTimes(2);
    expect(sourceCollection.deleteMany).toHaveBeenCalledTimes(2);
    expect(destCollection.insertMany).toHaveBeenCalledTimes(2);
    expect(mockMongoClientSessionInstance.commitTransaction).toHaveBeenCalledTimes(2);
  });
});
