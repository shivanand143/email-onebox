import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChromaClient, Collection } from "chromadb";
import { appConfig } from "../config";
import { KnowledgeDocument } from "../types";
import { logger } from "../logger";

// --- Initialize Chroma client ---
const client = new ChromaClient({ path: "http://localhost:8000" });
let collection: Collection | null = null;

async function getCollection() {
  try {
    if (!collection) {
      collection = await client.getOrCreateCollection({
        name: "knowledge_base",
        metadata: { description: "RAG Knowledge Base for Suggested Replies" },
      });
      logger.info("✅ Chroma collection initialized: knowledge_base");
    }
    return collection;
  } catch (err) {
    logger.error({ err }, "❌ Failed to connect to ChromaDB");
    throw new Error("ChromaDB unavailable");
  }
}

export const knowledgeRepository = {
  /**
   * Generates an embedding for given text using Gemini API.
   * Falls back to hashing when Gemini is unavailable.
   */
  async embedText(text: string): Promise<number[]> {
    try {
      if (!appConfig.gemini.apiKey) {
        throw new Error("Gemini API key not configured");
      }

      const genAI = new GoogleGenerativeAI(appConfig.gemini.apiKey);
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err) {
      logger.warn("⚠️ Gemini embedding failed, using fallback vector");
      const vector = new Array(128).fill(0);
      for (const word of text.split(/\W+/)) {
        const hash = [...word].reduce((a, c) => a + c.charCodeAt(0), 0) % vector.length;
        vector[hash] += 1;
      }
      return vector;
    }
  },

  /**
   * Adds documents to the Chroma vector store.
   * Automatically generates embeddings for each document.
   */
  async addDocuments(docs: KnowledgeDocument[]) {
    const coll = await getCollection();
    const embeddings = await Promise.all(docs.map((d) => this.embedText(d.content)));

    await coll.add({
      ids: docs.map((d) => d.id),
      documents: docs.map((d) => d.content),
      metadatas: docs.map((d) => ({
        title: d.title,
        createdAt: d.createdAt ?? new Date().toISOString(),
        updatedAt: d.updatedAt ?? new Date().toISOString(),
      })),
      embeddings,
    });

    logger.info(`🧠 Added ${docs.length} document(s) to ChromaDB`);
  },

  /**
   * Searches the most relevant knowledge documents for the given query.
   */
  async searchRelevant(query: string, topK = 3): Promise<KnowledgeDocument[]> {
    const coll = await getCollection();
    const queryEmbedding = await this.embedText(query);

    const results = await coll.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });

    const matches: KnowledgeDocument[] = (results.documents?.[0] ?? []).map((content, i) => ({
      id: String(results.ids?.[0]?.[i] ?? `doc_${i}`),
      title: String(results.metadatas?.[0]?.[i]?.title ?? "Untitled"),
      content: String(content ?? ""),
      createdAt: String(
        results.metadatas?.[0]?.[i]?.createdAt ?? new Date().toISOString()
      ),
      updatedAt: String(
        results.metadatas?.[0]?.[i]?.updatedAt ?? new Date().toISOString()
      ),
      embedding: Array.isArray(results.embeddings?.[0]?.[i])
        ? (results.embeddings[0][i] as number[])
        : [],
    }));

    logger.info(`🔍 Found ${matches.length} relevant docs for query`);
    return matches;
  },

  /**
   * Lists all stored documents from the knowledge base.
   */
  async list(): Promise<KnowledgeDocument[]> {
    const coll = await getCollection();
    const results = await coll.get();

    const docs: KnowledgeDocument[] = (results.documents ?? []).map((content, i) => ({
      id: String(results.ids?.[i] ?? `doc_${i}`),
      title: String(results.metadatas?.[i]?.title ?? "Untitled"),
      content: String(content ?? ""),
      createdAt: String(
        results.metadatas?.[i]?.createdAt ?? new Date().toISOString()
      ),
      updatedAt: String(
        results.metadatas?.[i]?.updatedAt ?? new Date().toISOString()
      ),
      embedding: [],
    }));

    return docs;
  },

  /**
   * Removes a document from ChromaDB by ID.
   */
  async remove(id: string): Promise<void> {
    try {
      const coll = await getCollection();
      await coll.delete({ ids: [id] });
      logger.info(`🗑️ Deleted document from ChromaDB: ${id}`);
    } catch (err) {
      logger.error({ err }, `❌ Failed to delete document ${id} from ChromaDB`);
      throw new Error("Failed to delete document from knowledge base");
    }
  },
};
