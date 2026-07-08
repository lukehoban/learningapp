import { AzureOpenAI } from 'openai';

let client: AzureOpenAI | null = null;

export function getOpenAIClient(): AzureOpenAI {
  if (!client) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o-mini';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? '2024-10-21';

    if (!endpoint || !apiKey) {
      throw new Error(
        'Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY.',
      );
    }

    client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });
  }
  return client;
}

export function isOpenAIConfigured(): boolean {
  return !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
}
