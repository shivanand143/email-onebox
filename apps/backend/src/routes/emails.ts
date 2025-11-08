import { Router } from "express";
import createHttpError from "http-errors";
import { z } from "zod";

import { searchService } from "../services/searchService";
import { emailClassifier } from "../services/classifier";
import { slackNotifier } from "../services/slackNotifier";
import { webhookNotifier } from "../services/webhookNotifier";
import { ragService } from "../services/ragService";
import { preloadKnowledgeBase } from "../setup/knowledgeTrainer";
import { EmailCategory } from "../types";

const router = Router();

const emailCategoryEnum = z.enum([
  "interested",
  "meeting_booked",
  "not_interested",
  "spam",
  "out_of_office",
  "uncategorized",
]);

const searchSchema = z.object({
  accountId: z.string().optional(),
  folder: z.string().optional(),
  query: z.string().optional(),
  categories: z
    .preprocess((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return value.split(",").filter(Boolean);
      return undefined;
    }, z.array(emailCategoryEnum).optional())
    .optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

// ✅ Search emails
router.get("/", async (req, res, next) => {
  try {
    const filters = searchSchema.parse(req.query);
    const results = await searchService.search(filters);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// ✅ Get one email
router.get("/:id", async (req, res, next) => {
  try {
    const email = await searchService.getEmail(req.params.id);
    if (!email) throw new createHttpError.NotFound("Email not found");
    res.json(email);
  } catch (error) {
    next(error);
  }
});

// ✅ Update category
router.post("/:id/category", async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = emailCategoryEnum.parse(req.body.category);

    const email = await searchService.getEmail(id);
    if (!email) throw new createHttpError.NotFound("Email not found");

    await searchService.updateEmail(id, { category });

    if (category === "interested") {
      await Promise.allSettled([
        slackNotifier.notifyInterested(email),
        webhookNotifier.notifyInterested(email),
      ]);
    }

    res.json({ id, category });
  } catch (error) {
    next(error);
  }
});

// ✅ Re-run categorization
router.post("/:id/reclassify", async (req, res, next) => {
  try {
    const { id } = req.params;
    const email = await searchService.getEmail(id);
    if (!email) throw new createHttpError.NotFound("Email not found");

    const category = await emailClassifier.categorize({
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody,
    });

    await searchService.updateEmail(id, { category });
    res.json({ id, category });
  } catch (error) {
    next(error);
  }
});

// ✅ Suggest AI reply (RAG)
router.post("/:id/suggest-reply", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, context } = req.body;

    const email = await searchService.getEmail(id);
    if (!email) throw new createHttpError.NotFound("Email not found");

    const result = await ragService.suggestReply({
      emailId: id,
      accountId: email.accountId,
      message,
      context,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ✅ Train Vector Knowledge Base (RAG)
router.post("/train", async (req, res, next) => {
  try {
    await preloadKnowledgeBase();
    res.json({
      success: true,
      message: "✅ Knowledge base trained successfully into vector DB (Chroma)",
    });
  } catch (error) {
    next(error);
  }
});

export const emailsRouter = router;
