import fs from "fs-extra";
import { nanoid } from "nanoid";

import { appConfig } from "../config";
import { logger } from "../logger";
import { ImapAccountConfig } from "../types";
import { ensureFile } from "../utils/fs";

const { accountsFile, baseDir } = appConfig.dataPaths;

ensureFile(accountsFile, JSON.stringify([], null, 2));
ensureFile(`${baseDir}/.gitkeep`, "");

export class AccountRepository {
  private cache: ImapAccountConfig[] | null = null;

  private async readAccounts(): Promise<ImapAccountConfig[]> {
    if (this.cache) {
      return this.cache;
    }

    try {
      const data = await fs.readFile(accountsFile, "utf8");
      const parsed = JSON.parse(data) as ImapAccountConfig[];
      this.cache = parsed;
      return parsed;
    } catch (error) {
      logger.error({ error }, "Failed to read accounts file");
      this.cache = [];
      return [];
    }
  }

  private async writeAccounts(accounts: ImapAccountConfig[]): Promise<void> {
    await fs.writeFile(accountsFile, JSON.stringify(accounts, null, 2), "utf8");
    this.cache = accounts;
  }

  async list(): Promise<ImapAccountConfig[]> {
    return this.readAccounts();
  }

  async findById(accountId: string): Promise<ImapAccountConfig | undefined> {
    const accounts = await this.readAccounts();
    return accounts.find((account) => account.id === accountId);
  }

  async add(account: Omit<ImapAccountConfig, "id" | "createdAt">): Promise<ImapAccountConfig> {
    const accounts = await this.readAccounts();
    const created: ImapAccountConfig = {
      ...account,
      id: nanoid(),
      createdAt: new Date().toISOString()
    };
    accounts.push(created);
    await this.writeAccounts(accounts);
    return created;
  }

  async update(accountId: string, update: Partial<ImapAccountConfig>): Promise<ImapAccountConfig | undefined> {
    const accounts = await this.readAccounts();
    const idx = accounts.findIndex((account) => account.id === accountId);
    if (idx === -1) {
      return undefined;
    }
    const updated = {
      ...accounts[idx],
      ...update
    };
    accounts[idx] = updated;
    await this.writeAccounts(accounts);
    return updated;
  }

  async remove(accountId: string): Promise<boolean> {
    const accounts = await this.readAccounts();
    const filtered = accounts.filter((account) => account.id !== accountId);
    const removed = filtered.length !== accounts.length;
    if (removed) {
      await this.writeAccounts(filtered);
    }
    return removed;
  }
}

export const accountRepository = new AccountRepository();

