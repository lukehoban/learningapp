// Joe's Learning App — Azure infrastructure
//
// Provisions everything to the right of "Prototype an app on my laptop" in
// the prototype -> production journey:
//   - Cloud Foundations:  Log Analytics + Application Insights (monitoring)
//   - Trusted Agent Platform: an Azure AI Foundry account + project, a model
//     deployment, and (created at first run by lib/agentClient.js) an Agent
//   - Agentic Software Delivery: a Linux App Service hosting the Node app,
//     with a system-assigned managed identity granted access to Foundry so
//     the app can call the Agent with no API keys.
//
// Deploy with:
//   az deployment group create -g <resource-group> -f infra/main.bicep \
//     -p appName=joes-learning-app
//
// See docs/DEPLOYMENT.md for the full walkthrough.

targetScope = 'resourceGroup'

@description('Short, unique-ish base name used to derive resource names (letters/numbers, lowercase).')
@minLength(3)
@maxLength(20)
param appName string = 'learningapp'

@description('Azure region for all resources.')
param location string = resourceGroup().location

@description('Model to deploy in Azure AI Foundry for the app/agent to use.')
param modelName string = 'gpt-4o-mini'

@description('Model version to deploy. Leave default unless you need to pin a specific version.')
param modelVersion string = '2024-07-18'

@description('Capacity (in thousands of tokens per minute) for the model deployment.')
param modelCapacity int = 10

var resourceToken = uniqueString(resourceGroup().id, appName)
var foundryAccountName = '${appName}-aif-${resourceToken}'
var foundryProjectName = '${appName}-proj'
var appServicePlanName = '${appName}-plan-${resourceToken}'
var webAppName = '${appName}-${resourceToken}'
var logAnalyticsName = '${appName}-logs-${resourceToken}'
var appInsightsName = '${appName}-ai-${resourceToken}'

// ---------- Cloud Foundations: monitoring ----------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
  }
}

// ---------- Trusted Agent Platform: Azure AI Foundry ----------

resource foundryAccount 'Microsoft.CognitiveServices/accounts@2025-04-01-preview' = {
  name: foundryAccountName
  location: location
  sku: { name: 'S0' }
  kind: 'AIServices'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    customSubDomainName: foundryAccountName
    publicNetworkAccess: 'Enabled'
    // Enables the Foundry Agent Service on this account.
    allowProjectManagement: true
  }
}

resource foundryProject 'Microsoft.CognitiveServices/accounts/projects@2025-04-01-preview' = {
  parent: foundryAccount
  name: foundryProjectName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    displayName: 'Joes Learning App'
    description: 'Homeschool learning app: lesson + quiz generation agent'
  }
}

resource modelDeployment 'Microsoft.CognitiveServices/accounts/deployments@2025-04-01-preview' = {
  parent: foundryAccount
  name: modelName
  sku: {
    name: 'GlobalStandard'
    capacity: modelCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: modelName
      version: modelVersion
    }
    raiPolicyName: 'Microsoft.Default'
  }
}

// ---------- Agentic Software Delivery: hosting ----------

resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: webAppName
  location: location
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      appCommandLine: 'npm start'
      appSettings: [
        {
          name: 'PROJECT_ENDPOINT'
          value: 'https://${foundryAccountName}.services.ai.azure.com/api/projects/${foundryProjectName}'
        }
        {
          name: 'MODEL_DEPLOYMENT_NAME'
          value: modelName
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
      ]
    }
  }
}

// Grant the Web App's managed identity permission to use the Foundry
// project/model — this is what lets the app call the Agent with zero API
// keys (DefaultAzureCredential picks up the managed identity automatically).
var cognitiveServicesOpenAIUserRoleId = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'

resource agentAccessRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(foundryAccount.id, webApp.id, cognitiveServicesOpenAIUserRoleId)
  scope: foundryAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cognitiveServicesOpenAIUserRoleId)
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output foundryAccountName string = foundryAccount.name
output foundryProjectEndpoint string = 'https://${foundryAccountName}.services.ai.azure.com/api/projects/${foundryProjectName}'
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output resourceGroupName string = resourceGroup().name
