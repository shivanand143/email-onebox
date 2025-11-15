Onebox Email Aggregator

A clean and simple README explaining how to run and understand the Onebox Email Aggregator project. This contains no project-submission wording, only pure documentation.


---

Overview

Backend (Node.js + TypeScript)

Connects to IMAP email accounts

Fetches & stores emails in Elasticsearch

Classifies emails using Gemini AI

Generates smart replies using RAG (ChromaDB + embeddings)

Sends Slack notifications and Webhook events for “Interested” emails


Frontend (React)

Displays emails with filters

Shows classification

Generates AI replies

Manages knowledge base items


ChromaDB

Stores small documents/templates used for RAG-based replies.


---

Requirements

Install the following before running:

Node.js 18+

Docker & Docker Compose

Google Gemini API key

(Optional) Slack Bot Token + Slack Channel



---

Project Structure

apps/
  backend/
  frontend/
docker-compose.yml
.env

Key Files

docker-compose.yml – Runs Elasticsearch, Kibana, ChromaDB

apps/backend – All backend services

apps/frontend – React interface

.env – Environment variables



---

Example .env File

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


---

How to Run

1. Start Docker Services

docker-compose up -d

Runs:

Elasticsearch → http://localhost:9200

Kibana → http://localhost:5601

ChromaDB → http://localhost:8000



---

2. Start Backend

cd apps/backend
npm install
npm run dev

Backend starts at http://localhost:4000


---

3. Start Frontend

cd apps/frontend
npm install
npm run dev

Frontend runs at http://localhost:5173


---

API Endpoints

Endpoint	Method	Description

/health	GET	Check backend status
/emails	GET	List all emails
/emails/:id	GET	Get details of a single email
/emails/:id/reclassify	POST	Re-run AI classification
/emails/:id/suggest-reply	POST	Generate AI reply
/knowledge	GET	List knowledge base entries
/knowledge	POST	Add entry
/knowledge/:id	DELETE	Delete entry
/accounts	GET	Show IMAP accounts



---

Testing Features

Open /emails in the browser to see stored emails

Generate AI reply from the frontend

Check Kibana index for email storage

Trigger Slack/Webhook by marking an email “Interested”

Add/delete Knowledge Base items



---

Reset Email Data

curl -X DELETE "http://localhost:9200/emails"

Or in Kibana Dev Tools:

DELETE /emails


---

How RAG Works (Simple)

1. ChromaDB stores small templates or reference documents.


2. Backend fetches relevant items using embeddings.


3. Combines them with the email content.


4. Gemini generates a context-aware reply.
