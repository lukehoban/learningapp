# ✨ Spark — an AI-powered learning app

Spark is a small, dynamic learning app for kids. A grown-up picks a topic, grade
level, and difficulty, and the app generates a fresh multiple-choice quiz — using
AI when it's configured, and a built-in offline question set when it isn't.

It was built for *Joe*, a devoted parent planning to home-school his kid, who wants
to use AI to create a dynamic learning app as a side project — following the journey
from a laptop prototype to a production app on Azure.

## Features

- 🎯 Pick any **topic**, **grade** (1–12), question **count**, and **difficulty**.
- 🤖 **AI-generated quizzes** via OpenAI or **Azure OpenAI / Azure AI Foundry**.
- 🔌 **Works offline** — a curated + procedurally-generated question set means the
  app is fully functional with no API key (great for prototyping and tests).
- ✅ Instant feedback with kid-friendly explanations and an encouraging score screen.

## Project layout

```
api/        Express + TypeScript backend (quiz generation, AI + offline)
frontend/   React + Vite + TypeScript UI
```

## Getting started

You'll need Node.js 18+.

### 1. Start the API

```bash
cd api
npm install
npm run dev        # http://localhost:3001
```

Without any configuration the API uses the offline question generator. To enable
AI-generated quizzes, copy `api/.env.example` to `api/.env` and fill in either the
OpenAI **or** Azure OpenAI settings:

```bash
cp .env.example .env
```

| Provider     | Variables |
| ------------ | --------- |
| OpenAI       | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| Azure OpenAI | `OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION` |

The Azure settings map directly to what you get from an **Azure AI Foundry** model
deployment (endpoint + deployment name), matching the "Find a capable model in
Foundry" step of the prototype → production journey.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The dev server proxies `/api/*` requests to the API on port 3001.

## API

### `GET /api/health`

Returns `{ "status": "ok", "ai": <boolean> }` where `ai` indicates whether an AI
provider is configured.

### `POST /api/quiz`

Request body:

```json
{
  "topic": "Math",
  "grade": 3,
  "count": 5,
  "difficulty": "easy"
}
```

`count` (default `5`, max `10`) and `difficulty` (`easy` | `medium` | `hard`,
default `medium`) are optional. Response:

```json
{
  "topic": "Math",
  "grade": 3,
  "difficulty": "easy",
  "source": "offline",
  "questions": [
    {
      "question": "What is 3 + 1?",
      "options": ["3", "7", "4", "9"],
      "answerIndex": 2,
      "explanation": "3 + 1 = 4."
    }
  ]
}
```

## Testing & building

Both packages use [Vitest](https://vitest.dev).

```bash
cd api && npm test && npm run build
cd frontend && npm test && npm run build
```
