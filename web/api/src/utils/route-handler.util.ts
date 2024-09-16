/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import { validateJsonData } from './json-data-validator.util';
import { appLogger } from '../configs/logger.config';

/**
 *
 * @param handler async handler function which should handle request
 * @returns Promise<any>
 *
 * This handler is specific for handling async routes
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const asyncRouteHandler = <T extends object>(
	handler: (req: Request, res: Response, next: NextFunction) => Promise<any>,
	reqEntity?: new () => T
) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			if (req.body.data) {
				req.body = JSON.parse(req.body.data);
			}
			if (reqEntity && req.body) {
				validateJsonData(reqEntity, req.body);
			}

			await handler(req, res, next);
		} catch (err) {
			// here, next will call the error handler middleware, where actual error handling occurs
			next(err);
		} finally {
			appLogger.info(
				'Finished [Path: %s] [Request-Id: %s] [Duration: %sms]',
				res.locals.url,
				res.getHeader('Request-Id'),
				Date.now() - res.locals.startTime
			);
		}
	};
};

/**
 *
 * @param handler synchronous handler function which should handle request
 * @returns Promise<any>
 *
 * This handler is specific for handling sync routes
 */
export const routeHandler = (handler: (req: Request, res: Response, next: NextFunction) => any) => {
	return (req: Request, res: Response, next: NextFunction): any => {
		try {
			handler(req, res, next);
		} catch (err) {
			// here, next will call the error handler middleware, where actual error handling occurs
			next(err);
		} finally {
			appLogger.info(
				'Finished [Path: %s] [Request-Id: %s] [Duration: %sms]',
				res.locals.url,
				res.getHeader('Request-Id'),
				Date.now() - res.locals.startTime
			);
		}
	};
};

/**
 *
 * @param handler async handler function which should handle request
 * @returns Promise<any>
 *
 * This handler is specific for handling async routes
 */
export const asyncMiddlewareHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			await handler(req, res, next);
		} catch (err) {
			// here, next will call the error handler middleware, where actual error handling occurs
			next(err);
		}
	};
};
