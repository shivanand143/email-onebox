import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";

import { emailsRouter } from "./routes/emails";
import { preloadKnowledgeBase } from "./setup/knowledgeTrainer";
import { logger } from "./logger";

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ Middleware setup
app.use(cors({ origin: process.env.WEB_APP_ORIGIN || "http://localhost:5173" }));
app.use(express.json());
app.use(morgan("dev"));

// ✅ API Routes
app.use("/emails", emailsRouter);

// ✅ Health Check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "✅ Email Aggregator API is running successfully" });
});

// ✅ Error Handler (with proper TypeScript types)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, "Unhandled server error");

  const status =
    typeof err === "object" && err && "status" in err
      ? (err as any).status
      : 500;

  const message =
    typeof err === "object" && err && "message" in err
      ? (err as any).message
      : "Internal Server Error";

  res.status(status).json({
    status,
    message,
  });
});

// ✅ Start server + preload vector DB
app.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);

  try {
    await preloadKnowledgeBase();
    logger.info("✅ Knowledge base loaded successfully into vector DB");
  } catch (err: unknown) {
    logger.error({ err }, "⚠️ Failed to preload knowledge base");
  }
});
