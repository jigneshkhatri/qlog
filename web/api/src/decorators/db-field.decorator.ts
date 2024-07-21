import 'reflect-metadata';

const dbFieldMetadataKey = Symbol('dbField');

/**
 * Add this decorator on the field in the entity class that represents the database column, or
 * custom made up column in the query. Using this decorator, database columns will be converted
 * to entity class fields. By using this decorator, we can name the database column and the entity
 * class fields differently.
 *
 * @param dbFieldName Mandatory - Name of the column (field) in database
 * @param isMappedEntity Optional - Default: false. Set it to "true" if the field is non-primitive (custom object) type
 * @param isMadeupField Optional - Default: false. Set it to "true" if the field actually does not exists in the database,
 * 						but it is derived by some other columns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dbField = (dbFieldName: string, isMappedEntity = false, isMadeupField = false): any => {
	return Reflect.metadata(dbFieldMetadataKey, { dbFieldName, isMappedEntity, isMadeupField });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDbFieldName = (target: any, propertyKey: string): string => {
	const metadata = Reflect.getMetadata(dbFieldMetadataKey, target, propertyKey);
	return metadata?.dbFieldName;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFieldMappedEntity = (target: any, propertyKey: string): string => {
	const metadata = Reflect.getMetadata(dbFieldMetadataKey, target, propertyKey);
	return metadata?.isMappedEntity;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFieldMadeup = (target: any, propertyKey: string): string => {
	const metadata = Reflect.getMetadata(dbFieldMetadataKey, target, propertyKey);
	return metadata?.isMadeupField;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFieldType = (target: any, propertyKey: string): any => {
	return Reflect.getMetadata('design:type', target, propertyKey);
};
