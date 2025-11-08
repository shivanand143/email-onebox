import { GoogleGenerativeAI } from "@google/generative-ai";
import { appConfig } from "../config";
import { knowledgeRepository } from "../repositories/knowledgeRepository";
import { KnowledgeDocument, SuggestedReplyRequest, SuggestedReplyResult } from "../types";
import { logger } from "../logger";

export class RagService {
  private client: GoogleGenerativeAI | null;

  constructor() {
    if (appConfig.gemini.apiKey) {
      this.client = new GoogleGenerativeAI(appConfig.gemini.apiKey);
      logger.info("✅ Gemini API connected for RAG replies");
    } else {
      this.client = null;
      logger.warn("⚠️ GOOGLE_API_KEY not configured. Using fallback replies only.");
    }
  }

  /**
   * Add knowledge documents into Chroma vector store.
   * Automatically sets timestamps and triggers embedding creation.
   */
  async addKnowledgeDocuments(docs: { id: string; title: string; content: string }[]): Promise<void> {
    const now = new Date().toISOString();
    const formattedDocs: KnowledgeDocument[] = docs.map((d) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      createdAt: now,
      updatedAt: now,
      embedding: [],
    }));

    await knowledgeRepository.addDocuments(formattedDocs);
    logger.info(`🧠 Added ${formattedDocs.length} knowledge docs to Chroma`);
  }

  /**
   * Suggest a reply using RAG (Retrieval-Augmented Generation).
   */
  async suggestReply(request: SuggestedReplyRequest): Promise<SuggestedReplyResult> {
    const { message, context } = request;

    // 1️⃣ Retrieve relevant docs from Chroma
    const sources = await knowledgeRepository.searchRelevant(
      message + (context ? `\n${context}` : "")
    );

    const contextString = sources
      .map((s) => `- ${s.title}: ${s.content}`)
      .join("\n");

    // 2️⃣ Fallback if Gemini not configured
    if (!this.client) {
      const fallback = `Thank you for your message! ${
        contextString ? "Here’s some info I found:\n" + contextString : ""
      }`;
      return { reply: fallback, sources };
    }

    // 3️⃣ Build prompt
    const prompt = `
You are a helpful email assistant.
Use the following context to write a short, polite, and relevant reply.
Keep it under 120 words.

Context:
${contextString || "(no additional context)"}

Incoming Email:
${message}

Extra Instructions:
${context || "Keep the tone professional and concise."}

Your reply:
`;

    try {
      const model = this.client.getGenerativeModel({
        model: appConfig.gemini.replyModel,
      });

      const result = await model.generateContent(prompt);
      const reply =
        result.response.text().trim() ||
        "Thanks for reaching out! Looking forward to speaking soon.";

      return {
        reply,
        sources: sources.map((s) => ({
          ...s,
          createdAt: s.createdAt ?? new Date().toISOString(),
          updatedAt: s.updatedAt ?? new Date().toISOString(),
          embedding: s.embedding ?? [],
        })),
      };
    } catch (err: any) {
      logger.error({ err }, "❌ Failed to generate reply with Gemini");
      const fallback = "Thank you for your email! I’ll get back to you soon.";
      return { reply: fallback, sources };
    }
  }
}

export const ragService = new RagService();
