# learningapp

**Joe's Learning App** — a dynamic, AI-powered homeschool learning app prototype.

This is the "Prototype an app on my laptop" step of the *prototype → production*
journey: Joe (a parent/founder homeschooling his kid) wants a simple app that
teaches a topic and quizzes his kid, adapting difficulty as they improve. This
repo is a working local prototype he can run today, and later wire up to a
real model in Azure AI Foundry, deploy as an Agent, and connect to Azure.

## What it does

1. Pick a **subject**, **topic**, and **grade level**.
2. The app generates a short **lesson** and a **multiple-choice quiz**.
3. As the learner answers, the app tracks their score and **adapts the
   difficulty** (level 1–3) for next time — easier if they struggled, harder
   if they aced it.
4. Works instantly offline with built-in sample lessons (Math, Science,
   Reading) — no API key required. When an AI key *is* configured, any
   subject/topic works and content is generated fresh each time.

## Running it locally

```
npm install
npm start
```

Then open http://localhost:3000.

## Enabling AI-generated lessons (optional)

By default the app uses a small built-in content bank so it works out of the
box. To let it generate lessons for *any* topic dynamically, set one of:

**OpenAI:**
```
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o-mini   # optional, this is the default
```

**Azure OpenAI / Azure AI Foundry** (the "Find a capable model in Foundry" step):
```
export AZURE_OPENAI_ENDPOINT=https://<your-resource>.openai.azure.com
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_DEPLOYMENT=<your-deployment-name>
```

Restart the server after setting these — the header badge will show
"AI generation enabled" once configured.

## Project structure

```
server.js            Express server + /api/lesson, /api/subjects, /api/topics
lib/contentBank.js    Offline fallback lessons/quizzes (Math, Science, Reading)
lib/aiGenerator.js    OpenAI / Azure OpenAI integration
public/index.html     Front-end markup
public/app.js         Front-end logic (lesson flow, quiz, adaptive difficulty)
public/styles.css     Styling
```

## Next steps toward production

Following the prototype → production journey, natural next steps are:
deploy the model/app behind an Agent, connect the app to that Agent, host it
somewhere accessible to others (Azure App Service/Container Apps/Functions),
set up CI/CD via GitHub, and add monitoring (usage, cost, performance).
