import { Request } from 'express';
import PaginationParams from './pagination.param';
import CommonMongoEntity from '../../entities/common/common.mongo.entity';
import GlobalConstants from '../../constants/global.constant';
import { convertToDbFieldName } from '../../utils/db-entity.util';

/**
 * Call this method in the route layer for any of the API that should support pagination.
 * Then pass the returned pagination instance to the controller -> repository layer to enable the
 * pagination for the data that needs to be returned.
 *
 * @param req Http request, which should contain the pagination query parameters as mentioned in "PaginationParams" class
 * @returns Instance of PaginationParams with the sanitized pagination params fetched from the query params of the request
 */
export const buildPaginationParams = (req: Request): PaginationParams => {
	const paginationParam = new PaginationParams();

	const limitParameters = validateAndGetLimitParameters(req?.query?.pageNo, req?.query?.pageSize);
	paginationParam.pageNo = limitParameters.pageNo;
	paginationParam.pageSize = limitParameters.pageSize;

	paginationParam.orderBy = req?.query?.orderBy ? (req.query.orderBy as string) : undefined;

	paginationParam.totalRecords = req?.query?.totalRecords ? parseInt(req?.query?.totalRecords as string) : undefined;

	return paginationParam;
};

export const validateAndGetLimitParameters = (
	pageNo?: unknown,
	pageSize?: unknown
): { pageNo: number; pageSize: number; offset: number } => {
	let tempPageSize = pageSize ? parseInt(pageSize as string) : GlobalConstants.defaultPageSize;
	tempPageSize = tempPageSize > GlobalConstants.maxPageSize ? GlobalConstants.maxPageSize : tempPageSize;
	const tempPageNo = pageNo ? parseInt(pageNo as string) : GlobalConstants.defaultPageNo;
	const offset = (tempPageNo - 1) * tempPageSize;
	return { pageNo: tempPageNo, pageSize: tempPageSize, offset };
};

// name:desc,id:asc,updatedOn:desc
export const buildOrderByClause = <T extends CommonMongoEntity>(
	paginationParams: PaginationParams,
	destinationEntity: new () => T,
	alias: string | undefined
): string => {
	let orderByClause = '';
	let prefix = '';
	const orderByParams = paginationParams.orderBy?.split(',').map((item: string) => item.trim());
	orderByParams?.forEach((single) => {
		orderByClause += prefix;
		prefix = ',';

		const parts = single.split(' ');
		let propertyName = single;
		let orderByDirection = 'desc';
		if (parts.length === 2) {
			propertyName = parts[0];
			orderByDirection = parts[1];
		}

		const entity = new destinationEntity();

		
		orderByClause += '"' + convertToDbFieldName(destinationEntity, propertyName) + '":"' + orderByDirection + '"';
		
	});
	if (paginationParams.customOrderByBefore) {
		const temp = orderByClause;
		orderByClause = paginationParams.customOrderByBefore;
		orderByClause += prefix;
		prefix = ',';
		orderByClause += temp;
	}
	if (paginationParams.customOrderByAfter) {
		orderByClause += prefix + paginationParams.customOrderByAfter;
	}
	return orderByClause;
};
