import { Router } from "express";
import createHttpError from "http-errors";
import { knowledgeRepository } from "../repositories/knowledgeRepository";
import { logger } from "../logger";

export const knowledgeRouter = Router();

/**
 * GET /knowledge
 * → List all knowledge base documents
 */
knowledgeRouter.get("/", async (_req, res, next) => {
  try {
    const docs = await knowledgeRepository.list();
    res.json(docs);
  } catch (err) {
    logger.error({ err }, "❌ Failed to load knowledge base");
    next(new createHttpError.InternalServerError("Failed to load knowledge base"));
  }
});

/**
 * POST /knowledge
 * → Add one or multiple knowledge documents
 * Supports:
 *  - Single object { title, content }
 *  - Array of documents [{ title, content }, ...]
 */
knowledgeRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body;

    // Normalize: accept either single or multiple documents
    const docs = Array.isArray(body) ? body : [body];

    if (!docs.every((d) => d.title && d.content)) {
      throw new createHttpError.BadRequest("Each document must include a title and content.");
    }

    const now = new Date().toISOString();
    const formatted = docs.map((d) => ({
      id: d.id || Date.now().toString() + Math.random().toString(36).substring(2, 8),
      title: d.title,
      content: d.content,
      createdAt: d.createdAt ?? now,
      updatedAt: now,
      embedding: [],
    }));

    await knowledgeRepository.addDocuments(formatted);
    res.status(201).json({ message: `✅ Added ${formatted.length} document(s) successfully.` });
  } catch (err) {
    logger.error({ err }, "❌ Failed to add documents to knowledge base");
    next(new createHttpError.InternalServerError("Failed to add knowledge documents"));
  }
});

/**
 * DELETE /knowledge/:id
 * → Remove a knowledge document by ID
 */
knowledgeRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) throw new createHttpError.BadRequest("Missing document ID");
    await knowledgeRepository.remove(id);
    res.json({ message: `🗑️ Document ${id} deleted successfully.` });
  } catch (err) {
    logger.error({ err }, "❌ Failed to delete document from knowledge base");
    next(new createHttpError.InternalServerError("Failed to delete knowledge document"));
  }
});
