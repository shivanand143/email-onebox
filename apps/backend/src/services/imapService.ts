import { ImapFlow, MailboxLockObject } from "imapflow";

import { appConfig } from "../config";
import { logger } from "../logger";
import { accountRepository } from "../repositories/accountRepository";
import { EmailRecord, ImapAccountConfig } from "../types";
import { emailProcessor } from "./emailProcessor";

const DEFAULT_FOLDERS = ["INBOX"];

interface AccountSession {
  account: ImapAccountConfig;
  client: ImapFlow;
  isSyncing: boolean;
  currentLock?: MailboxLockObject;
}

export class ImapSyncManager {
  private sessions = new Map<string, AccountSession>();

  async warmStart() {
    const accounts = await accountRepository.list();
    await Promise.all(accounts.map((account) => this.startAccount(account)));
  }

  async startAccount(account: ImapAccountConfig) {
    if (this.sessions.has(account.id)) {
      logger.warn({ accountId: account.id }, "Account already started");
      return;
    }

    const client = new ImapFlow({
      host: account.imap.host,
      port: account.imap.port,
      secure: account.imap.secure,
      auth: account.imap.auth,
      logger: false
    });

    const session: AccountSession = {
      account,
      client,
      isSyncing: false
    };

    this.sessions.set(account.id, session);

    client.on("error", (error) => {
      logger.error({ accountId: account.id, error }, "IMAP client error");
    });

    client.on("close", () => {
      logger.warn({ accountId: account.id }, "IMAP connection closed");
      this.sessions.delete(account.id);
    });

    (client as unknown as { on: (event: string, listener: (...args: any[]) => void) => ImapFlow }).on(
      "mail",
      async (mailboxPath: string) => {
        logger.debug({ accountId: account.id, mailboxPath }, "New mail event");
        await this.fetchLatest(account.id, mailboxPath);
      }
    );

    await client.connect();
    logger.info({ accountId: account.id }, "Connected to IMAP");
    await this.initialSync(account.id);
  }

  private async withMailbox<T>(accountId: string, mailbox: string, callback: (lock: MailboxLockObject) => Promise<T>) {
    const session = this.sessions.get(accountId);
    if (!session) {
      throw new Error(`Account session ${accountId} not found`);
    }
    const { client } = session;
    const lock = await client.getMailboxLock(mailbox);
    session.currentLock = lock;
    try {
      return await callback(lock);
    } finally {
      lock.release();
      session.currentLock = undefined;
    }
  }

  private async initialSync(accountId: string) {
    const session = this.sessions.get(accountId);
    if (!session) {
      logger.warn({ accountId }, "Cannot perform initial sync; session missing");
      return;
    }

    if (session.isSyncing) {
      return;
    }
    session.isSyncing = true;

    try {
      const folders = session.account.folders.length > 0 ? session.account.folders : DEFAULT_FOLDERS;
      for (const folder of folders) {
        await this.syncFolder(session.account.id, folder, 30);
      }
    } finally {
      session.isSyncing = false;
    }
  }

  private async syncFolder(accountId: string, folder: string, lookbackDays = 30) {
    const sinceDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    await this.withMailbox(accountId, folder, async () => {
      const session = this.sessions.get(accountId);
      if (!session) {
        return;
      }

      const { client } = session;
      const uids = await client.search({ since: sinceDate });
      const uidList = Array.isArray(uids) ? uids : [];
      logger.info({ accountId, folder, count: uidList.length }, "Syncing emails from mailbox");

      if (uidList.length === 0) {
        return;
      }

      const recentUids = uidList.slice(-30);

      for await (const message of client.fetch(recentUids, { source: true, flags: true })) {
        if (!message?.source) {
          continue;
        }
        await emailProcessor.process({
          accountId,
          folder,
          uid: message.uid,
          source: message.source as Buffer,
          flags: message.flags ? Array.from(message.flags) : []
        });
      }
    });
  }

  private async fetchLatest(accountId: string, mailboxPath: string) {
    await this.withMailbox(accountId, mailboxPath, async () => {
      const session = this.sessions.get(accountId);
      if (!session) {
        return;
      }
      const { client } = session;
      const mailbox = client.mailbox;
      if (!mailbox || mailbox.exists === 0) {
        return;
      }

      const lastUid = mailbox.uidNext - 1;
      if (lastUid <= 0) {
        return;
      }

      for await (const message of client.fetch(lastUid, { source: true, flags: true })) {
        if (!message.source) {
          continue;
        }
        await emailProcessor.process({
          accountId,
          folder: mailboxPath,
          uid: message.uid,
          source: message.source as Buffer,
          flags: message.flags ? Array.from(message.flags) : []
        });
      }
    });
  }

  async stopAccount(accountId: string) {
    const session = this.sessions.get(accountId);
    if (!session) {
      return;
    }

    try {
      await session.currentLock?.release();
    } catch (error) {
      logger.warn({ accountId, error }, "Failed to release mailbox lock");
    }

    await session.client.close();
    this.sessions.delete(accountId);
  }

  async restartAccount(accountId: string) {
    await this.stopAccount(accountId);
    const account = await accountRepository.findById(accountId);
    if (!account) {
      return;
    }
    await this.startAccount(account);
  }

  async registerAccount(account: ImapAccountConfig) {
    await this.startAccount(account);
  }

  async removeAccount(accountId: string) {
    await this.stopAccount(accountId);
  }

  async listActiveSessions(): Promise<Record<string, { account: ImapAccountConfig; connected: boolean }>> {
    const response: Record<string, { account: ImapAccountConfig; connected: boolean }> = {};
    for (const [accountId, session] of this.sessions.entries()) {
      response[accountId] = {
        account: session.account,
        connected: session.client?.authenticated === true
      };
    }
    return response;
  }
}

export const imapSyncManager = new ImapSyncManager();