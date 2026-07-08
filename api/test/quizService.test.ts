import { describe, it, expect } from "vitest";
import { parseAiQuestions, isAiConfigured, readAiConfig } from "../src/quizService.js";

describe("parseAiQuestions", () => {
  it("parses a well-formed response", () => {
    const raw = JSON.stringify({
      questions: [
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          answerIndex: 1,
          explanation: "2 + 2 = 4.",
        },
      ],
    });
    const parsed = parseAiQuestions(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].answerIndex).toBe(1);
  });

  it("accepts a bare array", () => {
    const raw = JSON.stringify([
      {
        question: "Q?",
        options: ["a", "b", "c", "d"],
        answerIndex: 0,
      },
    ]);
    const parsed = parseAiQuestions(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].explanation).toBeTruthy(); // default filled in
  });

  it("drops malformed questions", () => {
    const raw = JSON.stringify({
      questions: [
        { question: "no options", options: [], answerIndex: 0 },
        { question: "bad index", options: ["a", "b", "c", "d"], answerIndex: 9 },
        { question: "too few", options: ["a", "b"], answerIndex: 0 },
        {
          question: "good",
          options: ["a", "b", "c", "d"],
          answerIndex: 2,
          explanation: "ok",
        },
      ],
    });
    const parsed = parseAiQuestions(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].question).toBe("good");
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseAiQuestions("not json")).toEqual([]);
  });
});

describe("isAiConfigured", () => {
  it("is false when nothing is configured", () => {
    expect(isAiConfigured(readAiConfig({} as NodeJS.ProcessEnv))).toBe(false);
  });

  it("is true with an OpenAI key", () => {
    expect(
      isAiConfigured(readAiConfig({ OPENAI_API_KEY: "sk-test" } as NodeJS.ProcessEnv))
    ).toBe(true);
  });

  it("is true with Azure endpoint + deployment", () => {
    expect(
      isAiConfigured(
        readAiConfig({
          AZURE_OPENAI_ENDPOINT: "https://x.openai.azure.com",
          AZURE_OPENAI_DEPLOYMENT: "gpt-4o",
        } as NodeJS.ProcessEnv)
      )
    ).toBe(true);
  });
});
