export type EmailCategory =
  | "interested"
  | "meeting_booked"
  | "not_interested"
  | "spam"
  | "out_of_office"
  | "uncategorized";

export interface ImapAuthConfig {
  user: string;
  pass: string;
}

export interface ImapConnectionConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: ImapAuthConfig;
}

export interface ImapAccountConfig {
  id: string;
  label: string;
  email: string;
  folders: string[];
  imap: ImapConnectionConfig;
  createdAt: string;
}

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
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSearchFilters {
  accountId?: string;
  folder?: string;
  categories?: EmailCategory[];
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  embedding?: number[];
  createdAt: string;
  updatedAt: string;
}


export interface SuggestedReplyRequest {
  emailId: string;
  message: string;
  accountId: string;
  context?: string;
}

export interface SuggestedReplyResult {
  reply: string;
  sources: KnowledgeDocument[];
}

