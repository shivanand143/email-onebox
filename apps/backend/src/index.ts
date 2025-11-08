import http from "node:http";
import { createApp } from "./app";
import { appConfig } from "./config";
import { ensureEmailIndex } from "./clients/elasticsearch";
import { logger } from "./logger";
import { imapSyncManager } from "./services/imapService";
import { ensureDir } from "./utils/fs";
import { preloadKnowledgeBase } from "./setup/knowledgeTrainer";

const start = async () => {
  ensureDir(appConfig.dataPaths.baseDir);
  await ensureEmailIndex();

  await preloadKnowledgeBase(); // ✅ Preload RAG knowledge base

  const app = createApp();
  const server = http.createServer(app);

  server.listen(appConfig.port, appConfig.host, () => {
    logger.info({ port: appConfig.port }, "🚀 Backend server listening");
  });

  await imapSyncManager.warmStart();
};

start().catch((error) => {
  logger.error({ error }, "❌ Failed to start server");
  process.exit(1);
});
