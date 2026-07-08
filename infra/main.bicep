targetScope = 'resourceGroup'

@description('Base name for all resources (2-12 lowercase alphanumeric chars)')
@minLength(2)
@maxLength(12)
param baseName string = 'mathapp'

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Azure OpenAI model deployment name')
param openAIDeploymentName string = 'gpt-4o-mini'

@description('Azure OpenAI API version')
param openAIApiVersion string = '2024-10-21'

// ───────────────────────────────────────────
// Azure OpenAI
// ───────────────────────────────────────────
resource openAI 'Microsoft.CognitiveServices/accounts@2024-04-01-preview' = {
  name: '${baseName}-openai'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: '${baseName}-openai'
    publicNetworkAccess: 'Enabled'
  }
}

resource openAIDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-04-01-preview' = {
  parent: openAI
  name: openAIDeploymentName
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: openAIDeploymentName
      version: '2024-07-18'
    }
  }
}

// ───────────────────────────────────────────
// Static Web App (hosts React frontend + Functions API)
// ───────────────────────────────────────────
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: '${baseName}-swa'
  location: location
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

// ───────────────────────────────────────────
// App Settings — inject OpenAI credentials into Functions
// ───────────────────────────────────────────
resource swaAppSettings 'Microsoft.Web/staticSites/config@2023-12-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_OPENAI_ENDPOINT: openAI.properties.endpoint
    AZURE_OPENAI_API_KEY: openAI.listKeys().key1
    AZURE_OPENAI_DEPLOYMENT: openAIDeploymentName
    AZURE_OPENAI_API_VERSION: openAIApiVersion
  }
}

// ───────────────────────────────────────────
// Outputs
// ───────────────────────────────────────────
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output openAIEndpoint string = openAI.properties.endpoint
output openAIDeploymentName string = openAIDeploymentName
