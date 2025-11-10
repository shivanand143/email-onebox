# Onebox Email Aggregator - Final Submission

---

## Hello

My name is Shivanand Pujari. I made this Onebox Email Aggregator project for the assessment.
This app connect IMAP email account, get emails, store them in Elasticsearch, and use Gemini AI to check email type.
It also send Slack message and Webhook when email is Interested.
It give AI reply using Gemini and ChromaDB (RAG system).

I write this readme in easy way, so anybody can run it.

---

## Small overview

* Backend use Node and TypeScript. It connect IMAP and save all emails in Elasticsearch.
* AI Gemini check and divide emails (Interested, Not Interested, Spam, etc).
* ChromaDB store small data (knowledge) for smart reply.
* Frontend use React to show all emails, filters and reply.
* Slack and webhook work when email mark as Interested.

---

## Need before run

1. Node.js version 18 or more
2. Docker and Docker Compose install
3. Google Gemini API key (for AI)
4. Slack bot token and channel

---

## Important files

* `docker-compose.yml` - start Elasticsearch, Kibana, ChromaDB
* `apps/backend` - backend server
* `apps/frontend` - frontend app
* `.env` - put all variable (example below)

---

## .env

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

If no Gemini key, still work but AI part use fallback.

---

## Step 1 - Start docker services

In terminal inside project folder write:

```
docker-compose up -d
```

It start

* Elasticsearch ([http://localhost:9200](http://localhost:9200))
* Kibana ([http://localhost:5601](http://localhost:5601))
* ChromaDB ([http://localhost:8000](http://localhost:8000))

If not working, check using `docker ps` or `docker-compose logs`.

---

## Step 2 - Run backend

```
cd apps/backend
npm install
npm run dev
```

Then backend will start at port 4000.
It show message “Backend server listening”.
Go browser and open `http://localhost:4000/emails`. You will see email JSON data.

---

## Step 3 - Run frontend

```
cd apps/frontend
npm install
npm run dev
```

Now open `http://localhost:5173` in browser.
If it not show, refresh page one or two times.

---

## Step 4 - Check all API endpoints

Base URL:

```
http://localhost:4000
```

| Endpoint                    | Method | Use                          | Example                                                                |
| --------------------------- | ------ | ---------------------------- | ---------------------------------------------------------------------- |
| `/health`                   | GET    | Check backend server working | [http://localhost:4000/health](http://localhost:4000/health)           |
| `/emails`                   | GET    | Show all emails data         | [http://localhost:4000/emails](http://localhost:4000/emails)           |
| `/emails/:id`               | GET    | Show single email            | [http://localhost:4000/emails/1](http://localhost:4000/emails/1)       |
| `/emails/:id/reclassify`    | POST   | Re-check email category      | send `{}` body                                                         |
| `/emails/:id/suggest-reply` | POST   | Generate AI reply            | send `message` and `context` in JSON                                   |
| `/knowledge`                | GET    | Show all knowledge base      | [http://localhost:4000/knowledge](http://localhost:4000/knowledge)     |
| `/knowledge`                | POST   | Add new knowledge item       | send array JSON                                                        |
| `/knowledge/:id`            | DELETE | Delete knowledge item        | [http://localhost:4000/knowledge/1](http://localhost:4000/knowledge/1) |
| `/accounts`                 | GET    | Show all email accounts      | [http://localhost:4000/accounts](http://localhost:4000/accounts)       |

---

## Step 5 - Test the features

1. **Emails** – go to `/emails` link and see data.
2. **Kibana** – open `http://localhost:5601` to see emails index.
3. **AI Reply** – open frontend, click Show AI Reply → Generate Suggested Reply.
4. **Slack/Webhook** – when any email marked Interested, you get Slack message or webhook.site log.
5. **Knowledge Base** – `/knowledge` show stored templates and outreach data.

---

## Step 6 - Clean old data

If you want start new, delete Elasticsearch index:

```
curl -X DELETE "http://localhost:9200/emails"
```

Or open Kibana → Dev Tools → type `DELETE /emails`

---

## Step 7 - If any problem

* If ChromaDB not work, check Docker running.
* If Gemini error, wait few seconds (rate limit).
* If Slack not send, check token and channel.
* If frontend not load, refresh or check backend running.

---

## Step 8 - How AI Reply (RAG) work simple

1. Some text documents (like meeting link, thank you message) store inside ChromaDB.
2. When user click Generate Reply, backend take email + these docs and ask Gemini to write reply.
3. Gemini give reply using that knowledge.
   For example:
   Email says “Can you attend interview?” → Reply comes “You can book time here: [https://cal.com/example”](https://cal.com/example”)

---

## Step 9 - Submission

Uploaded Files:

* apps/backend
* apps/frontend
* docker-compose.yml
* README.md
* .env

I uploaded my real keys, if possible please use your keys.

---

## Last words

I am Shivanand. I make this full project by myself step by step.
I test every part on my own laptop.
I learn how to use IMAP, Elasticsearch, Slack, Webhook, and AI RAG system.
I also take some help from AI for learning and writing code better.
Thank you for checking my project.

LinkedIn: [https://www.linkedin.com/in/shivanandpujari](https://www.linkedin.com/in/shivarp)
Email: [shivanandpujari2003@gmail.com](mailto:shivanandpujari666@gmail.com)
Mobile: +91 9164502542
