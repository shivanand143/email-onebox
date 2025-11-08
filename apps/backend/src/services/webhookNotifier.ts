import axios from "axios";
import { appConfig } from "../config";
import { logger } from "../logger";
import { EmailRecord } from "../types";

export class WebhookNotifier {
  private lastSentTime = 0;
  private sentIds = new Set<string>(); // prevent duplicates

  async notifyInterested(email: EmailRecord) {
    if (!appConfig.webhook.interestedUrl) return;

    // Prevent re-sending the same email
    if (this.sentIds.has(email.id)) {
      logger.info({ emailId: email.id }, "Skipping duplicate webhook send");
      return;
    }

    // Throttle: wait at least 8 seconds between sends
    const now = Date.now();
    const diff = now - this.lastSentTime;
    if (diff < 8000) {
      const delay = 8000 - diff;
      logger.debug({ delay }, "Throttling webhook to avoid rate limit...");
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const response = await axios.post(appConfig.webhook.interestedUrl, {
        event: "email.interested",
        data: {
          id: email.id,
          subject: email.subject,
          from: email.from,
          snippet: email.snippet,
          date: email.date,
          accountId: email.accountId,
        },
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info(
          { emailId: email.id, status: response.status },
          "✅ Webhook sent successfully"
        );
        this.sentIds.add(email.id);
        this.lastSentTime = Date.now();
      } else {
        logger.warn(
          { emailId: email.id, status: response.status },
          "⚠️ Webhook responded with non-200 status"
        );
      }
    } catch (error: any) {
      // If rate limited (429), wait and retry once
      if (error.response?.status === 429) {
        const retryAfter =
          parseInt(error.response?.headers["retry-after"]) * 1000 || 15000;
        logger.warn(
          { retryAfter },
          "⚠️ Rate limited by webhook target. Retrying once..."
        );
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        try {
          await axios.post(appConfig.webhook.interestedUrl, {
            event: "email.interested",
            data: {
              id: email.id,
              subject: email.subject,
              from: email.from,
              snippet: email.snippet,
              date: email.date,
              accountId: email.accountId,
            },
          });
          logger.info(
            { emailId: email.id },
            "✅ Webhook re-sent successfully after retry"
          );
          this.sentIds.add(email.id);
          this.lastSentTime = Date.now();
        } catch (retryError: any) {
          logger.error(
            { emailId: email.id, status: retryError.response?.status },
            "❌ Webhook retry failed"
          );
        }
      } else {
        logger.error(
          { message: error.message, status: error.response?.status },
          "❌ Failed to send interested webhook"
        );
      }
    }
  }
}

export const webhookNotifier = new WebhookNotifier();
