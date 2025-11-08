import path from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: process.env.BACKEND_ENV_PATH });

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .default("4000"),
  HOST: z.string().default("0.0.0.0"),
  ELASTICSEARCH_NODE: z.string().default("http://localhost:9200"),
  SLACK_BOT_TOKEN: z.string().optional(),
  SLACK_CHANNEL: z.string().optional(),
  INTERESTED_WEBHOOK_URL: z.string().optional(),
  // Provider switch
  PROVIDER: z.enum(["openai", "gemini"]).default("gemini"),
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  // Google AI Studio
  GOOGLE_API_KEY: z.string().optional(),
  // Vertex AI (optional)
  GOOGLE_VERTEX_PROJECT_ID: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().optional(),
  // Model ids (provider-agnostic strings)
  CLASSIFIER_MODEL: z.string().default("gemini-2.0-flash"),
  REPLY_MODEL: z.string().default("gemini-2.0-flash"),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  DATA_DIR: z.string().default(path.resolve(process.cwd(), "data")),
  ACCOUNTS_FILE: z.string().optional(),
  KNOWLEDGE_FILE: z.string().optional(),
  WEB_APP_ORIGIN: z.string().default("http://localhost:5173"),
  REDIS_URL: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten());
  process.exit(1);
}

export const appConfig = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  elasticsearchNode: parsed.data.ELASTICSEARCH_NODE,
  slack: {
    botToken: parsed.data.SLACK_BOT_TOKEN,
    channel: parsed.data.SLACK_CHANNEL
  },
  webhook: {
    interestedUrl: parsed.data.INTERESTED_WEBHOOK_URL
  },
  openai: {
    apiKey: parsed.data.OPENAI_API_KEY,
    classifierModel: parsed.data.CLASSIFIER_MODEL,
    replyModel: parsed.data.REPLY_MODEL,
    embeddingModel: parsed.data.EMBEDDING_MODEL
  },
  gemini: {
    apiKey: parsed.data.GOOGLE_API_KEY,
    projectId: parsed.data.GOOGLE_VERTEX_PROJECT_ID,
    location: parsed.data.GOOGLE_VERTEX_LOCATION,
    replyModel: parsed.data.REPLY_MODEL
  },
  provider: parsed.data.PROVIDER,
  dataPaths: {
    baseDir: parsed.data.DATA_DIR,
    accountsFile:
      parsed.data.ACCOUNTS_FILE ??
      path.resolve(parsed.data.DATA_DIR, "accounts.json"),
    knowledgeFile:
      parsed.data.KNOWLEDGE_FILE ??
      path.resolve(parsed.data.DATA_DIR, "knowledge.json")
  },
  webAppOrigin: parsed.data.WEB_APP_ORIGIN,
  redisUrl: parsed.data.REDIS_URL
};

export type AppConfig = typeof appConfig;