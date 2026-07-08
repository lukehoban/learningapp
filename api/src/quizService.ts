import OpenAI, { AzureOpenAI } from "openai";
import type { Quiz, QuizQuestion, QuizRequest } from "./types.js";
import { generateOfflineQuestions } from "./questionGenerator.js";

export interface AiConfig {
  /** OpenAI API key (for api.openai.com). */
  apiKey?: string;
  model?: string;
  /** Azure OpenAI endpoint, e.g. https://my-resource.openai.azure.com */
  azureEndpoint?: string;
  /** Azure OpenAI deployment name. */
  azureDeployment?: string;
  azureApiVersion?: string;
}

/** Read AI configuration from the environment. */
export function readAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig {
  return {
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL ?? "gpt-4o-mini",
    azureEndpoint: env.AZURE_OPENAI_ENDPOINT,
    azureDeployment: env.AZURE_OPENAI_DEPLOYMENT,
    azureApiVersion: env.AZURE_OPENAI_API_VERSION ?? "2024-06-01",
  };
}

/** Whether any AI provider is configured. */
export function isAiConfigured(config: AiConfig): boolean {
  const hasAzure = Boolean(config.azureEndpoint && config.azureDeployment);
  return Boolean(config.apiKey) || hasAzure;
}

function buildClient(config: AiConfig): { client: OpenAI; model: string } {
  if (config.azureEndpoint && config.azureDeployment) {
    const client = new AzureOpenAI({
      endpoint: config.azureEndpoint,
      apiKey: config.apiKey,
      apiVersion: config.azureApiVersion,
      deployment: config.azureDeployment,
    });
    return { client, model: config.azureDeployment };
  }
  const client = new OpenAI({ apiKey: config.apiKey });
  return { client, model: config.model ?? "gpt-4o-mini" };
}

function buildPrompt(req: QuizRequest): string {
  return [
    `Create ${req.count} multiple-choice quiz questions.`,
    `Topic: ${req.topic}.`,
    `Target grade level: ${req.grade}.`,
    `Difficulty: ${req.difficulty}.`,
    "Each question must have exactly 4 options and one correct answer.",
    "Use simple, encouraging, kid-friendly language.",
    "Respond with ONLY a JSON object of the form:",
    '{"questions":[{"question":"...","options":["a","b","c","d"],"answerIndex":0,"explanation":"..."}]}',
  ].join("\n");
}

/**
 * Validate and normalize the model's response into well-formed questions.
 * Any malformed question is dropped so the caller never sees bad data.
 */
export function parseAiQuestions(raw: string): QuizQuestion[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  const list =
    data && typeof data === "object" && Array.isArray((data as any).questions)
      ? (data as any).questions
      : Array.isArray(data)
        ? data
        : [];

  const questions: QuizQuestion[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const { question, options, answerIndex, explanation } = item as any;
    if (typeof question !== "string" || !question.trim()) continue;
    if (!Array.isArray(options) || options.length !== 4) continue;
    if (!options.every((o: unknown) => typeof o === "string" && o.trim())) continue;
    if (
      typeof answerIndex !== "number" ||
      answerIndex < 0 ||
      answerIndex > 3 ||
      !Number.isInteger(answerIndex)
    ) {
      continue;
    }
    questions.push({
      question: question.trim(),
      options: options.map((o: string) => o.trim()),
      answerIndex,
      explanation:
        typeof explanation === "string" && explanation.trim()
          ? explanation.trim()
          : "That's the correct answer.",
    });
  }
  return questions;
}

async function generateAiQuestions(
  req: QuizRequest,
  config: AiConfig
): Promise<QuizQuestion[]> {
  const { client, model } = buildClient(config);
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a friendly teacher who writes fun, accurate quiz questions for children.",
      },
      { role: "user", content: buildPrompt(req) },
    ],
  });
  const content = completion.choices[0]?.message?.content ?? "";
  return parseAiQuestions(content);
}

/**
 * Produce a quiz. Uses the configured AI provider when available and falls
 * back to the offline generator when AI is not configured or fails.
 */
export async function createQuiz(
  req: QuizRequest,
  config: AiConfig = readAiConfig()
): Promise<Quiz> {
  let questions: QuizQuestion[] = [];
  let source: Quiz["source"] = "offline";

  if (isAiConfigured(config)) {
    try {
      questions = await generateAiQuestions(req, config);
      if (questions.length > 0) {
        source = "ai";
      }
    } catch {
      questions = [];
    }
  }

  if (questions.length === 0) {
    questions = generateOfflineQuestions(req);
    source = "offline";
  }

  return {
    topic: req.topic,
    grade: req.grade,
    difficulty: req.difficulty,
    questions: questions.slice(0, req.count),
    source,
  };
}
