# Math Adventure 🧮

An interactive, AI-powered math learning app for kids in grades 1–4. Built with React + Azure Functions + Azure OpenAI, deployed on Azure Static Web Apps.

---

## ✨ Features

- **Progressive learning** — covers grades 1 through 4 with age-appropriate math topics
  - **Grade 1** — Addition & subtraction (0–20)
  - **Grade 2** — Addition & subtraction (up to 100)
  - **Grade 3** — Multiplication & division (tables 1–10)
  - **Grade 4** — Multi-digit operations & fractions
- **AI-powered problem generation** — Azure OpenAI dynamically creates unique problems tailored to each student's progress and streak
- **AI feedback** — Personalized, encouraging explanations after every answer
- **Adaptive difficulty** — Problems get harder as the student's streak grows
- **Graceful fallback** — All features work without AI via a built-in local problem generator
- **Progress tracking** — Real-time score, streak, and problem counter
- **Kid-friendly UI** — Large text, bright colors, emoji, animations

---

## 🏗️ Architecture

```
learningapp/
├── frontend/          # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # GradeSelector, MathProblemCard, FeedbackDisplay, ProgressTracker
│   │   ├── hooks/        # useMathSession (state management)
│   │   └── types/        # Shared TypeScript types
│   └── public/
│       └── staticwebapp.config.json   # Azure SWA routing config
│
├── api/               # Azure Functions v4 (Node.js + TypeScript)
│   └── src/
│       ├── functions/
│       │   ├── generateProblem.ts    # GET /api/generateProblem
│       │   └── checkAnswer.ts        # POST /api/checkAnswer
│       ├── problemGenerator.ts       # Local fallback problem generator
│       └── openaiClient.ts           # Azure OpenAI client
│
├── infra/             # Azure Bicep IaC
│   ├── main.bicep                    # Azure OpenAI + Static Web App
│   └── main.parameters.json
│
└── .github/workflows/
    └── azure-static-web-apps.yml    # CI/CD pipeline
```

**Azure services used:**
| Service | Purpose |
|---|---|
| Azure Static Web Apps | Hosts the React frontend + Azure Functions API together |
| Azure OpenAI (gpt-4o-mini) | Generates math problems & personalized feedback |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) (for deployment)
- An Azure subscription (for AI features)

### Local development

```bash
# 1. Install dependencies
cd frontend && npm install
cd ../api && npm install

# 2. Configure Azure OpenAI (optional – app works without it)
cp api/.env.example api/.env
# Edit api/.env and fill in your Azure OpenAI values

# 3. Start the API (in one terminal)
cd api && npm run start

# 4. Start the frontend (in another terminal)
cd frontend && npm run dev
```

The app is available at http://localhost:5173. API calls are proxied to `http://localhost:7071`.

### Environment variables (API)

| Variable | Description |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI resource endpoint |
| `AZURE_OPENAI_API_KEY` | API key for Azure OpenAI |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name (default: `gpt-4o-mini`) |
| `AZURE_OPENAI_API_VERSION` | API version (default: `2024-10-21`) |

---

## ☁️ Azure Deployment

### Option 1 — Bicep (IaC)

```bash
# Log in and set your subscription
az login
az account set --subscription "<your-subscription-id>"

# Create a resource group
az group create --name mathapp-rg --location eastus

# Deploy infrastructure (creates Azure OpenAI + Static Web App)
az deployment group create \
  --resource-group mathapp-rg \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json
```

### Option 2 — GitHub Actions (CI/CD)

1. Create the Azure Static Web App using the Bicep template above.
2. Copy the deployment token from the Azure portal.
3. Add it as `AZURE_STATIC_WEB_APPS_API_TOKEN` in your repository secrets.
4. Push to `main` — the workflow in `.github/workflows/azure-static-web-apps.yml` will build, test, and deploy automatically.

---

## 🧪 Running Tests

```bash
# Frontend component tests (Vitest + Testing Library)
cd frontend && npm test

# API unit tests (Vitest)
cd api && npm test
```

---

## 📋 API Reference

### `GET /api/generateProblem`

Generates a math problem adapted to the student's grade and current performance.

| Query param | Type | Default | Description |
|---|---|---|---|
| `grade` | 1–4 | 1 | Student's grade level |
| `correct` | number | 0 | Correct answers this session |
| `incorrect` | number | 0 | Wrong answers this session |
| `streak` | number | 0 | Current consecutive correct streak |

**Response**
```json
{
  "id": "uuid",
  "question": "7 × 8 = ?",
  "correctAnswer": 56,
  "grade": 3,
  "operation": "multiplication",
  "hint": "7 groups of 8"
}
```

### `POST /api/checkAnswer`

Checks the student's answer and returns AI-generated feedback.

**Request body**
```json
{
  "problemId": "uuid",
  "answer": 56,
  "correctAnswer": 56,
  "grade": 3,
  "operation": "multiplication",
  "question": "7 × 8 = ?"
}
```

**Response**
```json
{
  "correct": true,
  "feedback": "Well done! 7 × 8 = 56. ✓",
  "encouragement": "🌟 You are a math superstar!",
  "correctAnswer": 56
}
```
