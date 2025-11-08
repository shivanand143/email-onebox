import { WebClient } from "@slack/web-api";

import { appConfig } from "../config";
import { logger } from "../logger";
import { EmailRecord } from "../types";

export class SlackNotifier {
  private client: WebClient | null;

  constructor() {
    if (appConfig.slack.botToken) {
      this.client = new WebClient(appConfig.slack.botToken);
    } else {
      this.client = null;
      logger.info("Slack bot token not configured; skipping Slack notifications.");
    }
  }

  async notifyInterested(email: EmailRecord) {
    if (!this.client || !appConfig.slack.channel) {
      return;
    }

    try {
      const text = `:sparkles: *Interested lead!*\n*Subject:* ${email.subject}\n*From:* ${email.from.map((addr) => addr.address).join(", ")}\n*Snippet:* ${email.snippet ?? email.textBody?.slice(0, 140) ?? ""}`;
      await this.client.chat.postMessage({
        channel: appConfig.slack.channel,
        text
      });
    } catch (error) {
      logger.error({ error }, "Failed to send Slack notification");
    }
  }
}

export const slackNotifier = new SlackNotifier();

