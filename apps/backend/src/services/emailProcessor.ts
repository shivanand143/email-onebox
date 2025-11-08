import { ParsedMail, simpleParser, AddressObject } from "mailparser";
import { logger } from "../logger";
import { EmailCategory, EmailRecord, EmailAddressLike } from "../types";
import { emailClassifier } from "./classifier";
import { searchService } from "./searchService";
import { slackNotifier } from "./slackNotifier";
import { webhookNotifier } from "./webhookNotifier";

interface ProcessEmailOptions {
  accountId: string;
  folder: string;
  uid: number;
  source: Buffer;
  flags?: string[];
}

const mapAddress = (input?: AddressObject | AddressObject[]) => {
  if (!input) return [] as EmailAddressLike[];
  const list = Array.isArray(input) ? input : [input];
  const results: EmailAddressLike[] = [];

  for (const item of list) {
    for (const value of item.value ?? []) {
      if (value.address) {
        results.push({
          name: value.name ?? undefined,
          address: value.address
        });
      }
    }
  }

  return results;
};

// Utility: Delay helper for throttling
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class EmailProcessor {
  private processedCount = 0;

  async processBatch(emails: ProcessEmailOptions[]): Promise<void> {
    // Process only the latest 30 emails
    const latestEmails = emails.slice(-30);

    for (const [index, email] of latestEmails.entries()) {
      await this.process(email);

      // Throttle every 10 emails for 8 seconds to respect Gemini free-tier
      this.processedCount++;
      if (this.processedCount % 10 === 0) {
        logger.info("Throttling: waiting 8 seconds to respect Gemini rate limit...");
        await delay(8000);
      }
    }
  }

  async process(options: ProcessEmailOptions): Promise<EmailRecord | null> {
    const { accountId, folder, source, uid } = options;
    try {
      const parsed: ParsedMail = await simpleParser(source);

      const record: Omit<EmailRecord, "id" | "createdAt" | "updatedAt" | "category"> = {
        accountId,
        folder,
        messageId: parsed.messageId ?? `${accountId}:${folder}:${uid}`,
        subject: parsed.subject ?? "(no subject)",
        from: mapAddress(parsed.from),
        to: mapAddress(parsed.to),
        cc: mapAddress(parsed.cc),
        bcc: mapAddress(parsed.bcc),
        date: (parsed.date ?? new Date()).toISOString(),
        textBody: parsed.text ?? undefined,
        htmlBody: parsed.html ? parsed.html.toString() : undefined,
        snippet: parsed.text?.slice(0, 160),
        flags: options.flags ?? [],
        metadata: {
          uid,
          attachments: parsed.attachments?.map((attachment) => ({
            filename: attachment.filename ?? undefined,
            contentType: attachment.contentType,
            size: attachment.size
          }))
        }
      };

      // Categorize email with AI (Gemini or fallback)
      const category: EmailCategory = await emailClassifier.categorize({
        subject: record.subject,
        textBody: record.textBody,
        htmlBody: record.htmlBody
      });

      const stored = await searchService.indexEmail({
        ...record,
        category
      });

      // Send Slack/Webhook notifications for interested leads
      if (category === "interested") {
        await Promise.allSettled([
          slackNotifier.notifyInterested(stored),
          webhookNotifier.notifyInterested(stored)
        ]);
      }

      logger.info({ subject: record.subject, category }, "Processed email");
      return stored;
    } catch (error: any) {
      logger.error({
        message: error.message,
        stack: error.stack
      }, "Failed to process email");
      return null;
    }
  }
}

export const emailProcessor = new EmailProcessor();
