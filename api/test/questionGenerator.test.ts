import { describe, it, expect } from "vitest";
import {
  generateOfflineQuestions,
  createRng,
} from "../src/questionGenerator.js";
import type { QuizRequest } from "../src/types.js";

function baseReq(overrides: Partial<QuizRequest> = {}): QuizRequest {
  return {
    topic: "math",
    grade: 3,
    count: 5,
    difficulty: "medium",
    ...overrides,
  };
}

describe("generateOfflineQuestions", () => {
  it("returns the requested number of questions", () => {
    const questions = generateOfflineQuestions(baseReq({ count: 7 }), 1);
    expect(questions).toHaveLength(7);
  });

  it("produces well-formed math questions with a correct answer", () => {
    const questions = generateOfflineQuestions(baseReq({ topic: "math" }), 42);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4); // options are unique
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(4);
      expect(q.question).toMatch(/What is \d+ [+\-×] \d+\?/);

      const match = q.question.match(/What is (\d+) ([+\-×]) (\d+)\?/);
      expect(match).not.toBeNull();
      const [, aStr, op, bStr] = match!;
      const a = Number(aStr);
      const b = Number(bStr);
      const expected = op === "+" ? a + b : op === "-" ? a - b : a * b;
      expect(Number(q.options[q.answerIndex])).toBe(expected);
    }
  });

  it("keeps subtraction answers non-negative", () => {
    const questions = generateOfflineQuestions(
      baseReq({ topic: "math", count: 10 }),
      7
    );
    for (const q of questions) {
      expect(Number(q.options[q.answerIndex])).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses the curated bank for known non-math topics", () => {
    const questions = generateOfflineQuestions(
      baseReq({ topic: "science", count: 3 }),
      5
    );
    expect(questions).toHaveLength(3);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(q.question).not.toMatch(/What is \d+/);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = generateOfflineQuestions(baseReq(), 123);
    const b = generateOfflineQuestions(baseReq(), 123);
    expect(a).toEqual(b);
  });

  it("scales number size with difficulty", () => {
    const easyMax = maxNumberSeen(
      generateOfflineQuestions(baseReq({ difficulty: "easy", count: 10 }), 9)
    );
    const hardMax = maxNumberSeen(
      generateOfflineQuestions(baseReq({ difficulty: "hard", count: 10 }), 9)
    );
    expect(hardMax).toBeGreaterThan(easyMax);
  });
});

describe("createRng", () => {
  it("returns numbers in [0, 1)", () => {
    const rng = createRng(1);
    for (let i = 0; i < 100; i++) {
      const n = rng();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

function maxNumberSeen(questions: { question: string }[]): number {
  let max = 0;
  for (const q of questions) {
    for (const n of q.question.match(/\d+/g) ?? []) {
      max = Math.max(max, Number(n));
    }
  }
  return max;
}
