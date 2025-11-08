import cors from "cors";
import express from "express";
import createHttpError from "http-errors";

import { appConfig } from "./config";
import { accountsRouter } from "./routes/accounts";
import { emailsRouter } from "./routes/emails";
import { knowledgeRouter } from "./routes/knowledge";
import { logger } from "./logger";

export const createApp = () => {
  const app = express();

  // ✅ Allow the frontend origin properly
  app.use(
    cors({
      origin: ["http://localhost:5173", appConfig.webAppOrigin || "*"],
      credentials: true,
    })
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/accounts", accountsRouter);
  app.use("/emails", emailsRouter);
  app.use("/knowledge", knowledgeRouter);

  app.use((_req, _res, next) => {
    next(new createHttpError.NotFound("Route not found"));
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      const httpError = createHttpError.isHttpError(err)
        ? err
        : new createHttpError.InternalServerError("Unexpected error");
      if (!createHttpError.isHttpError(err)) {
        logger.error({ err }, "Unhandled error");
      }
      res.status(httpError.status).json({
        message: httpError.message,
        status: httpError.status,
      });
    }
  );

  return app;
};
