import type { Difficulty, QuizRequest } from "./types.js";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export const MAX_QUESTIONS = 10;
export const MIN_GRADE = 1;
export const MAX_GRADE = 12;

export interface ValidationResult {
  value?: QuizRequest;
  error?: string;
}

/** Validate and normalize an incoming quiz request body. */
export function validateQuizRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;

  const topic = typeof b.topic === "string" ? b.topic.trim() : "";
  if (!topic) {
    return { error: "`topic` is required." };
  }
  if (topic.length > 100) {
    return { error: "`topic` must be 100 characters or fewer." };
  }

  const grade = Number(b.grade);
  if (!Number.isInteger(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
    return { error: `\`grade\` must be an integer between ${MIN_GRADE} and ${MAX_GRADE}.` };
  }

  const count = b.count === undefined ? 5 : Number(b.count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_QUESTIONS) {
    return { error: `\`count\` must be an integer between 1 and ${MAX_QUESTIONS}.` };
  }

  const difficulty = (b.difficulty ?? "medium") as Difficulty;
  if (!DIFFICULTIES.includes(difficulty)) {
    return { error: `\`difficulty\` must be one of: ${DIFFICULTIES.join(", ")}.` };
  }

  return { value: { topic, grade, count, difficulty } };
}
