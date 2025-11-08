import axios from "axios";

export type EmailCategory =
  | "interested"
  | "meeting_booked"
  | "not_interested"
  | "spam"
  | "out_of_office"
  | "uncategorized";

export interface EmailAddressLike {
  name?: string;
  address: string;
}

export interface EmailRecord {
  id: string;
  accountId: string;
  folder: string;
  messageId: string;
  subject: string;
  from: EmailAddressLike[];
  to: EmailAddressLike[];
  cc: EmailAddressLike[];
  bcc: EmailAddressLike[];
  date: string;
  textBody?: string;
  htmlBody?: string;
  snippet?: string;
  flags: string[];
  category: EmailCategory;
  createdAt: string;
  updatedAt: string;
}

export interface ImapAccountConfig {
  id: string;
  label: string;
  email: string;
  folders: string[];
  createdAt: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const client = axios.create({
  baseURL: "/api",
  timeout: 15000
});

export const api = {
  async listAccounts() {
    const { data } = await client.get<ImapAccountConfig[]>("/accounts");
    return data;
  },
  async fetchEmails(params: {
    accountId?: string;
    folder?: string;
    query?: string;
    categories?: EmailCategory[];
    page?: number;
    pageSize?: number;
  }) {
    const { data } = await client.get<{ items: EmailRecord[]; total: number; page: number; pageSize: number }>(
      "/emails",
      { params }
    );
    return data;
  },
  async getEmail(id: string) {
    const { data } = await client.get<EmailRecord>(`/emails/${id}`);
    return data;
  },
  async updateCategory(id: string, category: EmailCategory) {
    const { data } = await client.post(`/emails/${id}/category`, { category });
    return data as { id: string; category: EmailCategory };
  },
  async reclassify(id: string) {
    const { data } = await client.post<{ id: string; category: EmailCategory }>(`/emails/${id}/reclassify`);
    return data;
  },
  async suggestReply(id: string, message: string, context?: string) {
    const { data } = await client.post<{ reply: string; sources: KnowledgeDocument[] }>(
      `/emails/${id}/suggest-reply`,
      {
        message,
        context
      }
    );
    return data;
  },
  async listKnowledge() {
    const { data } = await client.get<KnowledgeDocument[]>("/knowledge");
    return data;
  },
  async addKnowledge(payload: { title: string; content: string }) {
    const { data } = await client.post<KnowledgeDocument>("/knowledge", payload);
    return data;
  },
  async removeKnowledge(id: string) {
    await client.delete(`/knowledge/${id}`);
  }
};

