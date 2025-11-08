import { Router } from "express";
import createHttpError from "http-errors";
import { z } from "zod";

import { accountRepository } from "../repositories/accountRepository";
import { imapSyncManager } from "../services/imapService";

const router = Router();

const accountSchema = z.object({
  label: z.string(),
  email: z.string().email(),
  folders: z.array(z.string()).default(["INBOX"]),
  imap: z.object({
    host: z.string(),
    port: z.number({ coerce: true }),
    secure: z.boolean(),
    auth: z.object({
      user: z.string(),
      pass: z.string()
    })
  })
});

type AccountInput = z.infer<typeof accountSchema>;

router.get("/", async (_req, res) => {
  const accounts = await accountRepository.list();
  res.json(accounts);
});

router.post("/", async (req, res, next) => {
  try {
    const payload = accountSchema.parse(req.body) as AccountInput;
    const account = await accountRepository.add({
      ...payload,
      folders: payload.folders ?? ["INBOX"]
    });
    await imapSyncManager.registerAccount(account);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const removed = await accountRepository.remove(id);
    if (!removed) {
      throw new createHttpError.NotFound("Account not found");
    }
    await imapSyncManager.removeAccount(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get("/sessions", async (_req, res) => {
  const sessions = await imapSyncManager.listActiveSessions();
  res.json(sessions);
});

router.post("/:id/restart", async (req, res, next) => {
  try {
    const { id } = req.params;
    const account = await accountRepository.findById(id);
    if (!account) {
      throw new createHttpError.NotFound("Account not found");
    }
    await imapSyncManager.restartAccount(id);
    res.json({ id, restarted: true });
  } catch (error) {
    next(error);
  }
});

export const accountsRouter = router;

