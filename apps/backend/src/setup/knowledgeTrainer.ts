import { knowledgeRepository } from "../repositories/knowledgeRepository";
import { logger } from "../logger";

export async function preloadKnowledgeBase() {
  try {
    logger.info("🚀 Preloading extended knowledge base...");

    const now = new Date().toISOString();

    const docs = [
      // --- Interested / Positive Leads ---
      {
        id: "1",
        title: "Outreach Intro",
        content:
          "When reaching out to leads, introduce the company briefly and include a meeting booking link. Example: 'We’d love to discuss how our platform can help you. You can schedule a quick demo here: https://cal.com/example'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "2",
        title: "Job Application Follow-Up",
        content:
          "If the lead or recruiter has shown interest, thank them and share the interview or meeting booking link: https://cal.com/example. Maintain a professional and polite tone.",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "3",
        title: "Interested Lead Response",
        content:
          "If a lead expresses interest, reply promptly, thank them, and include the meeting booking link. Example: 'Thank you for your interest! You can book a quick call here: https://cal.com/example'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },

      // --- Meeting Booked ---
      {
        id: "4",
        title: "Meeting Confirmation",
        content:
          "When a lead books a meeting, confirm the time and thank them. Example: 'Great, looking forward to our meeting on your scheduled slot. Let me know if you need to reschedule.'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "5",
        title: "Post-Meeting Follow-Up",
        content:
          "After a meeting, send a thank-you note and recap the key discussion points. Example: 'Thank you for meeting today! As discussed, here’s a quick summary and next steps.'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },

      // --- Not Interested ---
      {
        id: "6",
        title: "Not Interested Reply",
        content:
          "If a lead says they're not interested, respond politely and thank them for their time. Example: 'Thank you for your response! I completely understand. I appreciate your time and wish you success ahead.'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "7",
        title: "Re-Engagement After Rejection",
        content:
          "If the lead was previously not interested, wait a few months before re-engaging. Example: 'Hope you're doing well! We’ve recently launched some updates that might align with your goals — would you be open to a quick chat?'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },

      // --- Out of Office (OOO) ---
      {
        id: "8",
        title: "Out of Office Response",
        content:
          "When you receive an OOO reply, acknowledge it politely and note their return date. Example: 'Thank you for your message! I’ll reconnect once you’re back in office. Wishing you a relaxing break!'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "9",
        title: "OOO Auto-Response Handling",
        content:
          "If an automated OOO message is detected, delay follow-up emails until after their return date. Keep your CRM updated with the note 'OOO - follow up later.'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },

      // --- Spam / Marketing Filters ---
      {
        id: "10",
        title: "Spam Detection Guidance",
        content:
          "Emails with words like 'lottery', 'promotion', 'offer', or 'prize' are likely spam. Do not reply — instead, flag them and move to the spam folder.",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "11",
        title: "Unsubscribe Request Handling",
        content:
          "If someone requests to unsubscribe, reply courteously confirming that they’ve been removed. Example: 'Thank you for letting us know. You’ve been successfully unsubscribed from our mailing list.'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },

      // --- General Professional Replies ---
      {
        id: "12",
        title: "Generic Polite Reply",
        content:
          "When uncertain, maintain professionalism. Example: 'Thank you for your email. I’ll review this and get back to you shortly.' Always end with a polite closing like 'Best regards' or 'Warm wishes'.",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
      {
        id: "13",
        title: "Thank You Note",
        content:
          "Always end emails with gratitude when applicable. Example: 'Thank you for your time and consideration.'",
        createdAt: now,
        updatedAt: now,
        embedding: [],
      },
    ];

    await knowledgeRepository.addDocuments(docs);
    logger.info("✅ Extended knowledge base preloaded successfully with contextual data.");
  } catch (err) {
    logger.error({ err }, "⚠️ Failed to preload knowledge base");
  }
}
