import { getFieldType, isArrayField, isEnumField } from '../decorators/json-data.decorator';
import RequestValidationError, { ErroredParam } from '../errors/request-validation.error';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const validateJsonData = <T extends object>(entityType: new () => T, jsonData: any): void => {
	const jsonDataFieldErrors: ErroredParam[] = [];

	startValidation<T>(jsonData, entityType, '', jsonDataFieldErrors);

	if (jsonDataFieldErrors.length) {
		throw new RequestValidationError(
			RequestValidationError.errors.CGRVE0001.code,
			RequestValidationError.errors.CGRVE0001.message,
			undefined,
			jsonDataFieldErrors
		);
	}
};

const startValidation = <T extends object>(
	jsonData: any,
	entityType: new () => T,
	prefix = '',
	jsonDataFieldErrors: ErroredParam[]
): void => {
	if (Array.isArray(jsonData)) {
		jsonData.forEach((single) => {
			validateSingleJsonDataObject(entityType, single, prefix, jsonDataFieldErrors);
		});
	} else {
		validateSingleJsonDataObject(entityType, jsonData, prefix, jsonDataFieldErrors);
	}
};

const validateSingleJsonDataObject = <T extends object>(
	entityType: new () => T,
	jsonData: any,
	prefix: string,
	jsonDataFieldErrors: ErroredParam[]
): void => {
	const entityTypeObj = new entityType();
	const jsonDataProperties = Object.getOwnPropertyNames(jsonData);
	jsonDataProperties.forEach((jsonDataProperty) => {
		if (!jsonData[jsonDataProperty]) {
			return;
		}
		if (!Object.hasOwn(entityTypeObj, jsonDataProperty)) {
			jsonDataFieldErrors.push({
				field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
				message: 'Unknown field',
			});
			return;
		}

		const requiredType = getFieldType(entityTypeObj, jsonDataProperty);
		if (!requiredType) {
			jsonDataFieldErrors.push({
				field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
				message: 'Unknown field',
			});
			return;
		}

		const val = jsonData[jsonDataProperty];

		if (isArrayField(entityTypeObj, jsonDataProperty)) {
			if (!Array.isArray(val)) {
				jsonDataFieldErrors.push({
					field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
					message: 'Should be array',
				});
				return;
			}
			val.forEach((singleVal) => {
				validateSingleJsonDataField(
					jsonDataProperty,
					singleVal,
					entityTypeObj,
					requiredType,
					prefix,
					jsonDataFieldErrors
				);
			});
		} else {
			if (Array.isArray(val)) {
				jsonDataFieldErrors.push({
					field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
					message: 'Should not be array',
				});
				return;
			}
			validateSingleJsonDataField(
				jsonDataProperty,
				val,
				entityTypeObj,
				requiredType,
				prefix,
				jsonDataFieldErrors
			);
		}
	});
};

const validateSingleJsonDataField = (
	jsonDataProperty: string,
	singleFieldValue: any,
	entityTypeObj: any,
	requiredType: any,
	prefix: string,
	jsonDataFieldErrors: ErroredParam[]
): void => {
	if (isEnumField(entityTypeObj, jsonDataProperty)) {
		if (!(singleFieldValue in requiredType)) {
			jsonDataFieldErrors.push({
				field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
				message: 'Invalid enum value [' + singleFieldValue + ']',
			});
			return;
		}
	} else if (
		requiredType.name.toLowerCase() === 'string' ||
		requiredType.name.toLowerCase() === 'number' ||
		requiredType.name.toLowerCase() === 'boolean'
	) {
		if ((typeof singleFieldValue).toLowerCase() !== requiredType.name.toLowerCase()) {
			jsonDataFieldErrors.push({
				field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
				message: 'Value should be of type [' + requiredType.name + ']',
			});
			return;
		}
	} else if (requiredType.name.toLowerCase() === 'date') {
		if ((typeof singleFieldValue).toLowerCase() !== 'string') {
			jsonDataFieldErrors.push({
				field: prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
				message: 'Value should be of type [Date]',
			});
			return;
		}
	} else {
		startValidation(
			singleFieldValue,
			requiredType,
			prefix ? prefix + '.' + jsonDataProperty : jsonDataProperty,
			jsonDataFieldErrors
		);
	}
};
