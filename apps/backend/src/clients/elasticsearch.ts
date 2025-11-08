import { Client } from "@elastic/elasticsearch";

import { appConfig } from "../config";
import { logger } from "../logger";

const INDEX_NAME = "emails";

export const elasticClient = new Client({
  node: appConfig.elasticsearchNode
});

export const ensureEmailIndex = async () => {
  const exists = await elasticClient.indices.exists({ index: INDEX_NAME });
  if (!exists) {
    logger.info({ index: INDEX_NAME }, "Creating Elasticsearch index");
    await elasticClient.indices.create({
      index: INDEX_NAME,
      mappings: {
        dynamic: "strict",
        properties: {
          id: { type: "keyword" },
          accountId: { type: "keyword" },
          folder: { type: "keyword" },
          messageId: { type: "keyword" },
          subject: { type: "text" },
          from: {
            type: "nested",
            properties: {
              address: { type: "keyword" },
              name: { type: "text" }
            }
          },
          to: {
            type: "nested",
            properties: {
              address: { type: "keyword" },
              name: { type: "text" }
            }
          },
          cc: {
            type: "nested",
            properties: {
              address: { type: "keyword" },
              name: { type: "text" }
            }
          },
          bcc: {
            type: "nested",
            properties: {
              address: { type: "keyword" },
              name: { type: "text" }
            }
          },
          date: { type: "date" },
          textBody: { type: "text" },
          htmlBody: { type: "text" },
          snippet: { type: "text" },
          flags: { type: "keyword" },
          category: { type: "keyword" },
          metadata: {
            properties: {
              uid: { type: "long" },
              attachments: {
                type: "nested",
                properties: {
                  filename: { type: "keyword" },
                  contentType: { type: "keyword" },
                  size: { type: "long" }
                }
              }
            }
          },
          createdAt: { type: "date" },
          updatedAt: { type: "date" }
        }
      }
    });
  }
};

export const emailIndexName = INDEX_NAME;