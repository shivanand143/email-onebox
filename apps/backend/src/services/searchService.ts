import { nanoid } from "nanoid";

import { elasticClient, emailIndexName } from "../clients/elasticsearch";
import { logger } from "../logger";
import { EmailRecord, EmailSearchFilters } from "../types";

export class SearchService {
  async indexEmail(input: Omit<EmailRecord, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  }) {
    const now = new Date().toISOString();
    const document: EmailRecord = {
      ...input,
      id: input.id ?? nanoid(),
      createdAt: now,
      updatedAt: now
    };

    await elasticClient.index({
      index: emailIndexName,
      id: document.id,
      document
    });

    logger.debug({ id: document.id }, "Indexed email document");
    return document;
  }

  async updateEmail(id: string, update: Partial<EmailRecord>) {
    const now = new Date().toISOString();
    await elasticClient.update({
      index: emailIndexName,
      id,
      doc: {
        ...update,
        updatedAt: now
      }
    });
  }

  async getEmail(id: string) {
    try {
      const response = await elasticClient.get<EmailRecord>({
        index: emailIndexName,
        id
      });
      return response._source ?? null;
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async search(filters: EmailSearchFilters) {
    const { accountId, folder, categories, query, page = 1, pageSize = 25 } = filters;
    const must: Record<string, unknown>[] = [];

    if (accountId) {
      must.push({ term: { accountId } });
    }
    if (folder) {
      must.push({ term: { folder } });
    }
    if (categories && categories.length > 0) {
      must.push({ terms: { category: categories } });
    }
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: [
            "subject^3",
            "textBody",
            "htmlBody",
            "snippet",
            "from.name",
            "from.address",
            "to.name",
            "to.address"
          ],
          type: "best_fields"
        }
      });
    }

    const from = (page - 1) * pageSize;

    const response = await elasticClient.search<EmailRecord>({
      index: emailIndexName,
      from,
      size: pageSize,
      sort: [{ date: { order: "desc" } }],
      query: {
        bool: {
          must
        }
      }
    });

    const hits = response.hits.hits.map((hit) => hit._source!).filter(Boolean);
    const total = typeof response.hits.total === "number" ? response.hits.total : response.hits.total?.value ?? 0;

    return {
      items: hits,
      total,
      page,
      pageSize
    };
  }
}

export const searchService = new SearchService();

