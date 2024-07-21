import { Db, Collection } from 'mongodb';
import MongoConfig from '../../configs/mongo.config';
import CommonMongoEntity from '../../entities/common/common.mongo.entity';
import { convertEntityToMongoData, convertMongoDataToEntity } from '../../utils/db-entity.util';
import { buildOrderByClause, validateAndGetLimitParameters } from '../../utils/pagination/pagination.util';
import PaginationParams from '../../utils/pagination/pagination.param';
import BusinessLogicError from '../../errors/business-logic.error';

/**
 * Common abstract class for all the MongoDB repositories.
 * This class should be extended in every repository class for MongoDB entities.
 */
export default abstract class CommonMongoRepository<T extends CommonMongoEntity> {
	private _collectionName: string;
	private _db: Db | undefined;
	private _collection: Collection<T> | undefined;
	private _entityType: new () => T;

	/**
	 * This constructor should be called from child repository classes.
	 * @param collectionName Name of the collection for which repository is created. Should be passed from child class.
	 */
	protected constructor(collectionName: string, entityType: new () => T) {
		this._collectionName = collectionName;
		this._entityType = entityType;
	}

	/**
	 * In the child repository class, to query the MongoDB database, use this method to fetch the collection instance.
	 */
	protected get collection(): Collection<T> {
		if (!this._collection) {
			this._collection = this.db.collection(this._collectionName);
		}
		return this._collection;
	}

	/**
	 * In the child repository class, to query the MongoDB database, use this method to fetch the database instance (if required).
	 */
	protected get db(): Db {
		if (!this._db) {
			this._db = MongoConfig.getDatabase();
		}
		return this._db;
	}

	protected async findByCriteria(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		filter: any,
		paginationParams?: PaginationParams,
		projections?: { [key: string]: number }
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	): Promise<T | T[] | undefined> {
		let results;
		if (!projections) {
			projections = {};
		}
		if (paginationParams) {
			if (paginationParams.pageNo === 1 || !paginationParams.totalRecords) {
				paginationParams.totalRecords = await this.collection.countDocuments(filter);
			}
			const limitParameters = validateAndGetLimitParameters(paginationParams.pageNo, paginationParams.pageSize);
			const orderByClause = '{' + buildOrderByClause(paginationParams, this._entityType, undefined) + '}';
			results = this.collection
				.find(filter)
				.project(projections)
				.sort(JSON.parse(orderByClause))
				.skip(limitParameters.offset)
				.limit(limitParameters.pageSize);
		} else {
			results = this.collection.find(filter).project(projections);
		}
		return convertMongoDataToEntity(await results.toArray(), this._entityType);
	}

	public async insert(object: T | T[]): Promise<string | string[]> {
		const mongoObj = convertEntityToMongoData(this._entityType, object);
		if (Array.isArray(mongoObj)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await this.collection.insertMany(mongoObj as any);
			return result.insertedIds as [];
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await this.collection.insertOne(mongoObj as any);
		return result.insertedId?.toString();
	}

	public async update(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		filter: any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		valuesToSet?: { [key: string]: any },
		fieldsToUnset?: string | string[]
	): Promise<number> {
		if (!valuesToSet && !fieldsToUnset) {
			throw new BusinessLogicError('Either valuesToSet or fieldsToUnset parameter values are required');
		}

		const updateClause = [];
		if (valuesToSet) {
			updateClause.push({ $set: valuesToSet });
		}
		if (fieldsToUnset && fieldsToUnset.length) {
			updateClause.push({ $unset: fieldsToUnset });
		}

		const result = await this.collection.updateMany(filter, updateClause);
		return result.modifiedCount;
	}
}
