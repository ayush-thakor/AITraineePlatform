# AI Trainee Platform

Minimal trainee platform built with Next.js App Router, TailwindCSS, MongoDB, and Groq.

## What it includes

- Admin module creation with manual SOP text input
- SOP storage in MongoDB
- SOP chunking plus simple retrieval for RAG
- Training chat that answers from SOP context only
- Quiz generation from SOP content
- Deterministic quiz scoring with pass/fail at 70%
- Support chat with supervisor escalation when retrieval confidence is low

## Stack

- Next.js App Router
- TailwindCSS
- MongoDB with Mongoose
- Groq API
- TypeScript

## Routes

- `/admin/modules`
- `/admin/modules/new`
- `/training/[id]`
- `/quiz/[id]`
- `/support`

## Project structure

```text
/app
/components
/lib
/models
/utils
```

## Environment variables

Copy `.env.example` to `.env.local` and update the values.

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/ai-trainee-platform
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant
GROQ_EMBEDDING_MODEL=
GROQ_USE_EMBEDDINGS=false
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB locally, or point `MONGODB_URI` at your MongoDB instance.

3. Run the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Core workflow

1. Go to `/admin/modules/new`
2. Create a module and paste SOP content
3. The app saves the module and creates SOP chunks for retrieval
4. Open `/training/[id]` to ask training questions
5. Open `/quiz/[id]` to generate and submit a quiz
6. Open `/support` to resolve SOP-based operational questions

## Notes

- In Groq mode, the default setup uses lexical chunk ranking for retrieval so you can run the app without a separate embeddings provider.
- If you want vector retrieval later, set `GROQ_USE_EMBEDDINGS=true` and provide a compatible embeddings model.
- Quiz scoring is deterministic in application code. AI generates the questions, but does not decide pass or fail.
- Support escalation uses a simple similarity threshold. You can tune `ESCALATION_THRESHOLD` in `app/api/support/route.ts`.
- This repo keeps the first version intentionally small and readable.
