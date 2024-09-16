import express, { Request, Response } from "express";
import { asyncRouteHandler } from "../utils/route-handler.util";
import APIVersion from "../constants/api-version.constant";
import { ok200 } from "../utils/response.util";
import QLogController from "../controllers/qlog.controller";
import { buildPaginationParams } from "../utils/pagination/pagination.util";

const qLogRouter = express.Router();

const stream = async (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  await QLogController.getInstance().stream(req.params.appId, res);
};

const search = async (req: Request, res: Response) => {
  ok200(
    res,
    await QLogController.getInstance().search(
      req.params.appId,
      req.body,
      req.query.lastCreatedOn as string | undefined
    )
  );
};

qLogRouter.get(
  `/${APIVersion.v1}/stream/app/:appId`,
  asyncRouteHandler(stream)
);
qLogRouter.post(
  `/${APIVersion.v1}/search/app/:appId`,
  asyncRouteHandler(search)
);

export default qLogRouter;
