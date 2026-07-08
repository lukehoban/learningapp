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
server.js               Express server + /api/lesson, /api/subjects, /api/topics
lib/contentBank.js       Offline fallback lessons/quizzes (Math, Science, Reading)
lib/aiGenerator.js       Direct OpenAI / Azure OpenAI integration
lib/agentClient.js       Azure AI Foundry Agent Service integration
public/index.html        Front-end markup
public/app.js            Front-end logic (lesson flow, quiz, adaptive difficulty)
public/styles.css        Styling
infra/main.bicep         Azure infrastructure: Foundry account/project/model, App
                         Service, Application Insights, managed identity + RBAC
.github/workflows/       CI/CD: deploy to Azure on every push to main
docs/DEPLOYMENT.md       Full walkthrough for provisioning + deploying to Azure
```

## Deploying to Azure (production)

`lib/agentClient.js` is the preferred, "production" lesson-generation path:
it talks to an **Azure AI Foundry Agent** (keyless, via managed identity) that
wraps the deployed model. If it's not configured or a call fails, the app
falls back to `lib/aiGenerator.js` (direct OpenAI/Azure OpenAI), and finally
to the offline content bank — so the app is always available.

To provision the model, Agent, hosting, CI/CD, and monitoring described in
the prototype → production journey, see **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.
Short version:

```bash
az group create -n rg-learningapp -l eastus2
az deployment group create -g rg-learningapp -f infra/main.bicep -p appName=joeslearningapp
```

Then push to `main` to deploy the app via the included GitHub Actions
workflow (after a one-time OIDC setup — see the doc).
