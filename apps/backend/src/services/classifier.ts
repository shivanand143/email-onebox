import { GoogleGenerativeAI } from "@google/generative-ai";
import { appConfig } from "../config";
import { logger } from "../logger";
import { EmailCategory, EmailRecord } from "../types";

const FALLBACK_KEYWORDS: Record<EmailCategory, string[]> = {
  interested: ["interested", "let's talk", "keen", "excited", "love to"],
  meeting_booked: ["scheduled", "booked", "calendar", "meeting", "confirmed"],
  not_interested: ["not interested", "no thanks", "pass", "decline"],
  spam: ["unsubscribe", "lottery", "win", "offer", "promotion"],
  out_of_office: ["out of office", "ooo", "vacation", "away"],
  uncategorized: []
};

const FALLBACK_PRIORITY: EmailCategory[] = [
  "meeting_booked",
  "interested",
  "not_interested",
  "out_of_office",
  "spam",
  "uncategorized"
];

export class EmailClassifier {
  private genAI: GoogleGenerativeAI | null;

  constructor() {
    if (appConfig.provider === "gemini" && appConfig.gemini.apiKey) {
      this.genAI = new GoogleGenerativeAI(appConfig.gemini.apiKey);
    } else {
      this.genAI = null;
      logger.warn("Using fallback keyword classifier (no Gemini key detected).");
    }
  }

  private fallbackCategorize(content: string): EmailCategory {
    const lower = content.toLowerCase();
    for (const category of FALLBACK_PRIORITY) {
      if (category === "uncategorized") continue;
      const keywords = FALLBACK_KEYWORDS[category];
      if (keywords.some((keyword) => lower.includes(keyword))) {
        return category;
      }
    }
    return "uncategorized";
  }

  private async categorizeWithGemini(content: string): Promise<EmailCategory | null> {
    if (!this.genAI) return null;
    const model = this.genAI.getGenerativeModel({ model: appConfig.openai.classifierModel });

    const prompt = `Categorize the email into exactly one of:
- interested
- meeting_booked
- not_interested
- spam
- out_of_office
- uncategorized

Email:
${content}

Respond with only the category string.`;

    try {
      const res = await model.generateContent(prompt);
      const text = res.response.text().trim().toLowerCase().replace(/\s+/g, "_");

      const allowed: EmailCategory[] = [
        "interested",
        "meeting_booked",
        "not_interested",
        "spam",
        "out_of_office",
        "uncategorized"
      ];

      return allowed.includes(text as EmailCategory)
        ? (text as EmailCategory)
        : "uncategorized";
    } catch (err: any) {
      if (err.status === 429) {
        logger.warn("Gemini rate limit reached. Retrying after 8 seconds...");
        await new Promise(res => setTimeout(res, 8000));
      } else {
        logger.error({ err }, "Failed to classify email with Gemini");
      }
      return null;
    }
  }

  async categorize(email: Pick<EmailRecord, "subject" | "textBody" | "htmlBody">): Promise<EmailCategory> {
    const content = [email.subject, email.textBody, email.htmlBody]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 8000);

    const geminiResult = await this.categorizeWithGemini(content);
    if (geminiResult) return geminiResult;

    return this.fallbackCategorize(content);
  }
}

export const emailClassifier = new EmailClassifier();
