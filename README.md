# Onebox Email Aggregator

A complete email aggregation system that connects to IMAP inboxes, stores emails, classifies them using AI, and generates smart replies using RAG.

---

## 🚀 Overview

### **Backend (Node.js + TypeScript)**
- Connects to IMAP accounts
- Fetches & stores emails in **Elasticsearch**
- Classifies emails using **Gemini AI**
- Generates replies using **RAG** (ChromaDB + embeddings)
- Sends **Slack notifications & Webhook events** for *Interested* emails

### **Frontend (React)**
- Shows list of emails  
- Filtering & search  
- AI reply generation  
- Knowledge base management  

### **ChromaDB**
Stores small information snippets used for improved AI replies.

---

## 📦 Requirements

Install the following:

- **Node.js 18+**
- **Docker + Docker Compose**
- **Google Gemini API Key**
- *(Optional)* Slack Bot Token + Channel

---

## 📁 Project Structure

```
apps/
  backend/
  frontend/
docker-compose.yml
.env
```

### Important Files
- `docker-compose.yml` – Elasticsearch, Kibana, ChromaDB
- `apps/backend` – Backend API
- `apps/frontend` – React interface
- `.env` – Environment variables

---

## 🔑 Environment Variables

Create a `.env` file:

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

---

## 🐳 Run Using Docker

### 1. Start Required Services
```
docker-compose up -d
```

This starts:
- Elasticsearch → http://localhost:9200  
- Kibana → http://localhost:5601  
- ChromaDB → http://localhost:8000  

---

## ▶️ Start Backend

```
cd apps/backend
npm install
npm run dev
```

Backend runs at:
```
http://localhost:4000
```

---

## ▶️ Start Frontend

```
cd apps/frontend
npm install
npm run dev
```

Frontend runs at:
```
http://localhost:5173
```

---

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check backend status |
| `/emails` | GET | List all emails |
| `/emails/:id` | GET | Get a specific email |
| `/emails/:id/reclassify` | POST | Re-run AI classification |
| `/emails/:id/suggest-reply` | POST | Generate AI reply |
| `/knowledge` | GET | List knowledge base entries |
| `/knowledge` | POST | Add knowledge item |
| `/knowledge/:id` | DELETE | Delete item |
| `/accounts` | GET | View IMAP accounts |

---

## 🧪 Features to Test

- Open `/emails` to view stored emails  
- Generate AI reply from frontend  
- View email index in Kibana  
- Slack/Webhook notifications on “Interested” emails  
- Manage Knowledge Base items  

---

## 🧹 Reset Data

Delete Elasticsearch index:

```
curl -X DELETE "http://localhost:9200/emails"
```

Or in Kibana Dev Tools:

```
DELETE /emails
```

---

## 🧠 How RAG Works (Simple)

1. ChromaDB stores small templates or reference texts  
2. Backend finds relevant items using embeddings  
3. Combines them with the email content  
4. Gemini generates a context-aware, meaningful reply
