import express, { Request, Response } from 'express';
import { asyncRouteHandler } from '../utils/route-handler.util';
import APIVersion from '../constants/api-version.constant';
import AllQLogAppsController from '../controllers/all-qlog-apps.controller';
import { ok200 } from '../utils/response.util';

const allQLogAppsRouter = express.Router();

const findAll = async (req: Request, res: Response) => {
	ok200(res, await AllQLogAppsController.getInstance().findAll());
};

allQLogAppsRouter.get(`/${APIVersion.v1}/`, asyncRouteHandler(findAll));

export default allQLogAppsRouter;