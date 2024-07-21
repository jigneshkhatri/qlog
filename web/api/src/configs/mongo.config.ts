import { Db, MongoClient } from 'mongodb';
import { getEnvValue } from './env.config';
import { EnvKeys } from '../constants/env-keys.constant';

/**
 * Configuration class for MongoDB. This contains methods to initiate database connection and
 * few helper methods to get Db instance which will further be used by repositories to fetch
 * and query the required collections.
 */
export default class MongoConfig {
	private static _client: MongoClient;
	private static _db: Db;

	/**
	 * Initialize the Mongo client using connection string.
	 * This method will only be called during application startup,
	 * thus there will be only one Mongo client for application.
	 */
	private static _init(): void {
		MongoConfig._client = new MongoClient(getEnvValue(EnvKeys.mongoConStr) as string);
		console.log('MongoDB client initialized');
	}

	/**
	 *
	 * @returns Singleton instance of `MongoClient`
	 */
	private static _getClient(): MongoClient {
		return MongoConfig._client;
	}

	/**
	 *
	 * @returns Initializes the Mongo DB (database) if not already, and returns it. Mongo DB instance is singleton.
	 */
	public static getDatabase(): Db {
		// Check if database is not already initialized, then initialize it first
		if (!MongoConfig._db) {
			const dbName = getEnvValue(EnvKeys.mongoDbName) as string;
			MongoConfig._db = this._getClient().db(dbName);
			console.log('MongoDB database [%s] initialized', dbName);
		}
		return MongoConfig._db;
	}

	/**
	 * This method should be called to initialize and connect to
	 * database on startup (before starting the server)
	 */
	public static async connect(): Promise<void> {
		this._init();
		await this._getClient().connect();
		this.getDatabase().listCollections();
		console.log('MongoDB connected');
	}

	/**
	 * This method should be called on shutdown of the server to release the
	 * database connection and shutdown gracefully
	 */
	public static async disconnect(): Promise<void> {
		await this._getClient().close();
		console.log('MongoDB disconnected');
	}
}
