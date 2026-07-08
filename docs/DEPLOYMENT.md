# Deploying to Azure (prototype → production)

This covers the rest of the journey after running the app locally: deploying
a model in Azure AI Foundry, standing up an Agent, hosting the app on Azure,
wiring up CI/CD, and monitoring it.

## 0. Prerequisites

- An Azure subscription, and the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) installed and logged in (`az login`).
- Access to deploy `gpt-4o-mini` (or another chat model) in Azure AI Foundry in your subscription/region.

## 1. Provision Azure infrastructure (`infra/main.bicep`)

This one template provisions everything needed:

| Resource | Diagram step |
|---|---|
| Azure AI Foundry account + project | "Find a capable model in Foundry" |
| Model deployment (`gpt-4o-mini` by default) | "Deploy a Agent" (model backing it) |
| Linux App Service (Node 20) + managed identity | "Make my app accessible to others" |
| Role assignment granting the Web App's identity access to Foundry | "Connect my app to the Agent" (keyless auth) |
| Log Analytics + Application Insights | "Monitor my app's usage and performance" |

```bash
az group create -n rg-learningapp -l eastus2

az deployment group create \
  -g rg-learningapp \
  -f infra/main.bicep \
  -p appName=joeslearningapp
```

Grab the outputs — you'll need them next:

```bash
az deployment group show -g rg-learningapp -n main \
  --query properties.outputs --output json
```

This gives you `webAppName`, `webAppUrl`, and `foundryProjectEndpoint`.

The app's `PROJECT_ENDPOINT` and `MODEL_DEPLOYMENT_NAME` app settings are
already wired up by the template — the app will use the Foundry Agent as
soon as code is deployed and the first request creates the agent
automatically (see `lib/agentClient.js`).

## 2. Deploy the app code

The included `.github/workflows/deploy.yml` handles this on every push to
`main`. One-time setup:

1. Create (or reuse) an Azure AD App Registration / user-assigned managed
   identity, and add a **federated credential** trusting
   `repo:lukehoban/learningapp:ref:refs/heads/main` (Entra ID > App
   registrations > your app > Certificates & secrets > Federated credentials).
2. Grant that identity **Contributor** on `rg-learningapp` (or narrower:
   `Website Contributor` on the Web App is enough for just deploys).
3. In the GitHub repo, add these **Actions variables** (Settings > Secrets and
   variables > Actions > Variables):
   - `AZURE_CLIENT_ID` — the app registration's client ID
   - `AZURE_TENANT_ID` — your Entra tenant ID
   - `AZURE_SUBSCRIPTION_ID` — your subscription ID
   - `AZURE_WEBAPP_NAME` — the `webAppName` output from step 1
4. Push to `main` (or run the workflow manually) — it installs deps, smoke
   tests the server locally, then deploys via `azure/webapps-deploy`.

For a one-off manual deploy without CI/CD, you can also run:

```bash
az webapp up --name <webAppName> --resource-group rg-learningapp --runtime "NODE:20-lts"
```

## 3. Verify

```bash
curl https://<webAppUrl>/api/health
```

Should return `{"status":"ok","aiEnabled":true,"agentEnabled":true}` once the
Foundry Agent path is live (it falls back to direct-model or offline content
if the Agent call ever fails, so the app is always up).

## 4. Monitor

Application Insights is already wired up via the
`APPLICATIONINSIGHTS_CONNECTION_STRING` app setting. In the Azure Portal, open
the `*-ai-*` Application Insights resource to see:

- Live request/response metrics for `/api/lesson`
- Dependency calls out to the Agent Service
- Exceptions (e.g. Agent run failures that triggered a fallback)
- Usage over time (how many lessons/quizzes are being generated)

## Cleaning up

```bash
az group delete -n rg-learningapp --yes --no-wait
```
