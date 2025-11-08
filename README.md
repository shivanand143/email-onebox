# Onebox Email Aggregator — Final Submission

---

## Hello 👋

I built a Onebox Email Aggregator for the assessment. This app connects IMAP email accounts, indexes emails in Elasticsearch, classifies them with Gemini AI, stores outreach knowledge in ChromaDB, sends Slack/webhook alerts for interesting leads, and suggests replies using RAG.

I wrote this README to help you run the project easily. I’ve kept the steps small and clear — follow them one by one.

---

## Quick overview (in plain words)

* The backend (Node + TypeScript) talks to IMAP and stores emails in **Elasticsearch**.
* The AI (Gemini) classifies emails and makes suggested replies using knowledge stored in **ChromaDB**.
* The frontend (React) shows the email list, details, filters and the AI reply panel.
* Slack and a webhook URL are used when an email is marked **Interested**.

---

## Prerequisites (what you need before running)

1. Node.js (v18+) and npm installed.
2. Docker & Docker Compose installed.
3. A Google Gemini API key (if you want AI features) — put it in `.env` as `GOOGLE_API_KEY`.
4. A Slack app bot token and a channel name (optional) for Slack notifications.
5. Basic terminal / command-line knowledge.

---

## Files you will use

* `docker-compose.yml` — starts Elasticsearch, Kibana, and ChromaDB.
* `apps/backend` — backend source code (TypeScript + Express).
* `apps/frontend` — React app (UI).
* `.env` — put environment variables here (example below).

---

## Environment variables (copy to `.env`)

```
PORT=4000
HOST=0.0.0.0
ELASTICSEARCH_NODE=http://localhost:9200
PROVIDER=gemini
GOOGLE_API_KEY=YOUR_GEMINI_KEY
CLASSIFIER_MODEL=gemini-2.0-flash
REPLY_MODEL=gemini-2.0-flash
EMBEDDING_MODEL=text-embedding-3-small
SLACK_BOT_TOKEN=your-slack-bot-token
SLACK_CHANNEL=#your-channel
INTERESTED_WEBHOOK_URL=https://webhook.site/your-id
DATA_DIR=./data
WEB_APP_ORIGIN=http://localhost:5173
```

> Replace `YOUR_GEMINI_KEY`, `your-slack-bot-token`, and webhook URL with your own values. If you don’t have these, the app will still run but AI or Slack features will be in fallback mode.

---

## 1) Start the core services (Docker)

Open a terminal in the repo root and run:

```bash
docker-compose up -d
```

This will start:

* Elasticsearch (9200)
* Kibana (5601)
* ChromaDB (8000)

Check they are running:

* Elasticsearch health: `http://localhost:9200` (you should see JSON version info)
* Kibana UI: `http://localhost:5601`
* ChromaDB server: `http://localhost:8000` (Chroma returns a small JSON or 404 for root; the client uses /v2 endpoints)

If any service fails, run `docker-compose logs <service>` to inspect logs.

---

## 2) Install backend dependencies and start backend

Open a new terminal and go to backend folder:

```bash
cd apps/backend
npm install
npm run dev
```

What happens:

* The backend will create the Elasticsearch email index if not present.
* IMAP sync manager will attempt to connect to configured accounts (make sure you added accounts in the app settings or environment).
* The server preloads a small default knowledge base into ChromaDB (if available) on start.

**Verify**: the backend logs show `Backend server listening` and `Connected to IMAP` (if IMAP configured). Also check `http://localhost:4000/emails` to see indexed emails.

---

## 3) Start frontend

Open another terminal and run:

```bash
cd apps/frontend
npm install
npm run dev
```

Frontend usually runs at `http://localhost:5173`. Open that in the browser — you should see the UI. If it looks blank at first, try a hard reload (Ctrl+Shift+R) — sometimes the UI briefly shows during data load.

---

## 4) How to test features quickly

* **Search / Index**

  * Visit `http://localhost:4000/emails` to see the raw JSON emails (also used by frontend).
* **Kibana**

  * Open `http://localhost:5601` and inspect the `emails` index to see fields and data.
* **Slack & Webhook**

  * If an incoming email gets classified as `interested`, backend will post to your Slack channel and call the webhook URL. Watch backend logs to confirm or see webhook.site to confirm receipts.
* **Suggested Reply (RAG)**

  * Open an email in the frontend, click `Show AI Reply` and `Generate Suggested Reply` to get a context-aware reply. If Gemini or Chroma fail, the backend uses fallback heuristics.

---

## 5) Reset / Clean Elasticsearch (fresh start)

If you want to clear all indexed emails and start fresh:

```bash
# Delete the index (be careful) from terminal where you have curl
curl -X DELETE "http://localhost:9200/emails"
```

Or from Kibana Dev Tools: `DELETE /emails`.

---

## 6) Troubleshooting & common issues

* **ChromaDB errors**: If the backend logs show Chroma errors, make sure the Chroma container is running. Sometimes newer chroma images use `/v2` endpoints. The repo is set to talk to `http://localhost:8000`.

* **Gemini rate limits**: If you see rate limit errors, either reduce requests or use fallback keyword classifier. You will see log messages like `Gemini rate limit reached`.

* **Slack not receiving messages**: Make sure `SLACK_BOT_TOKEN` and `SLACK_CHANNEL` are correct and the bot is in the channel.

* **Frontend blank or frozen**: Hard reload the browser, check browser console for errors, and ensure backend API (`/emails`, `/accounts`, `/knowledge`) returns data.

---

## 7) How RAG (Suggested Replies) works — short explanation

1. I store outreach info (product info, meeting link, templates) as small text documents in ChromaDB — this is the *knowledge base*.
2. When user asks for a reply, backend:

   * Converts email text + optional context into an embedding (Gemini).
   * Uses ChromaDB to find the most relevant knowledge docs.
   * Sends email text + top knowledge docs as prompt to Gemini reply model.
   * Gemini returns a short suggested reply using that context.

This helps the reply include the correct meeting link or product detail automatically.

---

## 8) Submission checklist (what I will push to GitHub)

* `apps/backend` source code with clear commits
* `apps/frontend` source code
* `docker-compose.yml`
* `README.md` (this file)
* `.env.example` (do NOT include real keys)

> Make sure to remove or replace any real API keys before pushing. Use `.env.example` to show required variables.

---

## 9) Small personal note (to the reviewer)

Hi, I am Shivanand. I built this project to learn end-to-end email automation and RAG-based replies. I used Gemini for AI and ChromaDB for vector search. If anything looks odd in the repo, please check my commit history — I developed this step-by-step and tested each piece locally.

Thanks for reviewing my submission!




