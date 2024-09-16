/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import UUID from '../types/uuid.type';
import PaginationParams from './pagination/pagination.param';

export const ok200 = (
	res: Response,
	body: null | any = null,
	paginationParams?: PaginationParams
): Response<any, Record<string, any>> => {
	const responseBody: { data: any; paginationParams?: PaginationParams } = { data: body };
	if (paginationParams) {
		paginationParams.customOrderByBefore = undefined;
		paginationParams.customOrderByAfter = undefined;
		responseBody.paginationParams = paginationParams;
	}
	return response(res, 200, responseBody);
};
export const err400 = (res: Response, body: null | any = null): Response<any, Record<string, any>> => {
	return response(res, 400, { error: body });
};
export const err500 = (res: Response, body: null | any = null): Response<any, Record<string, any>> => {
	return response(res, 500, { error: body });
};
export const err401 = (res: Response, body: null | any = null): Response<any, Record<string, any>> => {
	return response(res, 401, { error: body });
};
export const err403 = (res: Response, body: null | any = null): Response<any, Record<string, any>> => {
	return response(res, 403, { error: body });
};
export const saveResponse = (res: Response, id: UUID): void => {
	ok200(res, { createdId: id });
};
export const multipleSaveResponse = (res: Response, id: UUID[]): void => {
	ok200(res, { createdIds: id });
};
export const updateResponse = (res: Response, count: number): void => {
	ok200(res, { updatedCount: count });
};

export const response = (
	res: Response,
	statusCode: number,
	body: null | any = null
): Response<any, Record<string, any>> => {
	if (body.data || body.error) {
		return res.status(statusCode).json(body);
	}
	return res.sendStatus(statusCode);
};
