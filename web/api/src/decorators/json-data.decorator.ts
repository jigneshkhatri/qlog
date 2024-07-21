import 'reflect-metadata';

const objectTypeMetadataKey = Symbol('validatedField');

/**
 * Add this decorator on the fields of the class that is used as an input to any of the API.
 * Using this decorator, request body of the API can be validated against the fields and their types.
 * If the fields other than that of the fields marked as "@jsonField" are received in the request
 * body then exception would be thrown.
 *
 * @param fieldType Optional - Pass the type of the field if it has any custom class type (non-primitive)
 * @param isArray Optional - Default: false. Set it to "true" if the field is array
 * @param isEnum Optional - Default: false. Set it to "true" if the field is enum
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsonField = (fieldType?: any, isArray = false, isEnum = false): any => {
	if (fieldType) {
		return Reflect.metadata(objectTypeMetadataKey, { fieldType, isArray, isEnum });
	} else {
		return Reflect.metadata(objectTypeMetadataKey, { isArray, isEnum });
	}
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFieldType = (target: any, propertyKey: string): any => {
	const metadata = Reflect.getMetadata(objectTypeMetadataKey, target, propertyKey);
	if (metadata) {
		if (metadata.fieldType) {
			return metadata.fieldType;
		}
		return Reflect.getMetadata('design:type', target, propertyKey);
	}
	return undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isArrayField = (target: any, propertyKey: string): boolean => {
	const metadata = Reflect.getMetadata(objectTypeMetadataKey, target, propertyKey);
	if (metadata) {
		return Reflect.getMetadata(objectTypeMetadataKey, target, propertyKey).isArray;
	}
	return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEnumField = (target: any, propertyKey: string): boolean => {
	const metadata = Reflect.getMetadata(objectTypeMetadataKey, target, propertyKey);
	if (metadata) {
		return Reflect.getMetadata(objectTypeMetadataKey, target, propertyKey).isEnum;
	}
	return false;
};
