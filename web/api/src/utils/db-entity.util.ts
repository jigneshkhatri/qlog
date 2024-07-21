import RequestValidationError from '../errors/request-validation.error';
import { getDbFieldName, getFieldType, isFieldMadeup, isFieldMappedEntity } from '../decorators/db-field.decorator';
import CommonMongoEntity from '../entities/common/common.mongo.entity';

export const convertToDbFieldName = <T extends CommonMongoEntity>(
	destinationEntity: new () => T,
	entityPropertyName: string,
	keyAlias: string | undefined = undefined,
	stage = 0,
	origEntityPropertyName?: string
): string => {
	if (!origEntityPropertyName) {
		origEntityPropertyName = entityPropertyName;
	}

	const entity = new destinationEntity();

	if (Object.hasOwn(entity, entityPropertyName)) {
		const dbFieldName = getDbFieldName(entity, entityPropertyName);

		const isMappedEntity = isFieldMappedEntity(entity, entityPropertyName);
		if (isMappedEntity) {
			throw new RequestValidationError(
				RequestValidationError.errors.CGRVE0001.code,
				RequestValidationError.errors.CGRVE0001.message,
				[
					{
						field: 'orderBy',
						message: origEntityPropertyName + ' is not a valid value',
					},
				]
			);
		}

		
		return keyAlias ? keyAlias + '.' + dbFieldName : dbFieldName;
	} else if (entityPropertyName.includes('.')) {
		const propertyNameParts = entityPropertyName.split(/\.(.*)/);
		const fieldType = getFieldType(entity, propertyNameParts[0]);
		if (fieldType) {
			const isMappedEntity = isFieldMappedEntity(entity, propertyNameParts[0]);
			if (!isMappedEntity) {
				const dbFieldName = getDbFieldName(entity, propertyNameParts[1]);
				const dbFieldWithAlias = keyAlias ? keyAlias + '.' + dbFieldName : dbFieldName;
				return dbFieldWithAlias;
			} else {
				const tempAlias = getDbFieldName(entity, propertyNameParts[0]);

				const dbFieldName = convertToDbFieldName(
					fieldType,
					propertyNameParts[1],
					tempAlias,
					stage + 1,
					origEntityPropertyName
				);
				const dbFieldWithAlias = keyAlias ? keyAlias + '.' + dbFieldName : dbFieldName;
				return dbFieldWithAlias;
			}
		} else {
			throw new RequestValidationError(
				RequestValidationError.errors.CGRVE0001.code,
				RequestValidationError.errors.CGRVE0001.message,
				[
					{
						field: 'orderBy',
						message: origEntityPropertyName + ' is not a valid value',
					},
				]
			);
		}
	} else {
		throw new RequestValidationError(
			RequestValidationError.errors.CGRVE0001.code,
			RequestValidationError.errors.CGRVE0001.message,
			[
				{
					field: 'orderBy',
					message: origEntityPropertyName + ' is not a valid value',
				},
			]
		);
	}
};

export const convertMongoDataToEntity = <T extends CommonMongoEntity>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dbResult: any,
	destinationEntity: new () => T
): T | T[] | undefined => {
	if (!dbResult || !destinationEntity) {
		return undefined;
	}

	if (Array.isArray(dbResult)) {
		const entities: T[] = [];
		dbResult.forEach((x) => entities.push(convertSingleMongoDocumentToEntity(destinationEntity, x)));
		return entities;
	} else {
		return convertSingleMongoDocumentToEntity(destinationEntity, dbResult);
	}
};

const convertSingleMongoDocumentToEntity = <T extends CommonMongoEntity>(
	destinationEntity: new () => T,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	dbResult: any
): T => {
	const entity = new destinationEntity();
	const propertyNames = Object.getOwnPropertyNames(entity);

	propertyNames.forEach((property) => {
		const dbFieldName = getDbFieldName(entity, property);

		if (!dbFieldName) {
			return;
		}

		const fieldType = getFieldType(entity, property);
		const isMappedEntity = isFieldMappedEntity(entity, property);

		if (!isMappedEntity) {
			entity[property as keyof T] = dbResult[dbFieldName];
		} else if (isMappedEntity && fieldType && !entity[property as keyof T]) {
			entity[property as keyof T] = convertMongoDataToEntity(
				dbResult[dbFieldName],
				fieldType
			) as typeof fieldType.name;
		}
	});
	return entity;
};

export const convertEntityToMongoData = <T extends CommonMongoEntity>(
	destinationEntity: new () => T,
	entityData: T | T[]
): object | object[] | undefined => {
	if (!entityData) {
		return undefined;
	}

	if (Array.isArray(entityData)) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const entities: object[] = [];
		entityData.forEach((x) => entities.push(convertSingleEntityObjectToMongoData(destinationEntity, x)));
		return entities;
	} else {
		return convertSingleEntityObjectToMongoData(destinationEntity, entityData);
	}
};

const convertSingleEntityObjectToMongoData = <T extends CommonMongoEntity>(
	destinationEntity: new () => T,
	entityData: T
): object => {
	const entityTypeObj = new destinationEntity();
	const mongoDataObj: { [key: string]: unknown } = {};
	const properties = Object.getOwnPropertyNames(entityData);
	properties.forEach((singleProperty) => {
		const dbFieldName = getDbFieldName(entityTypeObj, singleProperty);
		if (!dbFieldName) {
			return;
		}
		const requiredType = getFieldType(entityTypeObj, singleProperty);
		const isMappedEntity = isFieldMappedEntity(entityTypeObj, singleProperty);
		if (isMappedEntity || Array.isArray(entityData[singleProperty as keyof object])) {
			mongoDataObj[dbFieldName] = convertEntityToMongoData(
				requiredType,
				entityData[singleProperty as keyof object]
			);
		} else {
			mongoDataObj[dbFieldName] = entityData[singleProperty as keyof object];
		}
	});
	return mongoDataObj;
};
