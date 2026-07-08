import type { Grade, MathOperation, MathProblem } from './types';
import { randomUUID } from 'crypto';

interface GradeConfig {
  operations: MathOperation[];
  maxA: number;
  maxB: number;
  maxMultiply?: number;
}

const GRADE_CONFIGS: Record<Grade, GradeConfig> = {
  1: { operations: ['addition', 'subtraction'], maxA: 10, maxB: 10 },
  2: { operations: ['addition', 'subtraction'], maxA: 50, maxB: 50 },
  3: { operations: ['addition', 'subtraction', 'multiplication', 'division'], maxA: 20, maxB: 20, maxMultiply: 10 },
  4: { operations: ['addition', 'subtraction', 'multiplication', 'division'], maxA: 100, maxB: 100, maxMultiply: 12 },
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a simple deterministic math problem for the given grade.
 * Used as a local fallback when AI generation fails.
 */
export function generateLocalProblem(grade: Grade, streak: number): MathProblem {
  const config = GRADE_CONFIGS[grade];

  // Increase difficulty slightly with streak
  const difficultyMod = Math.min(streak, 5);
  const maxA = Math.min(config.maxA + difficultyMod * 5, config.maxA * 2);
  const maxB = Math.min(config.maxB + difficultyMod * 5, config.maxB * 2);

  const operation = config.operations[randInt(0, config.operations.length - 1)];

  let a: number, b: number, correctAnswer: number, question: string, hint: string | undefined;

  switch (operation) {
    case 'addition': {
      a = randInt(1, maxA);
      b = randInt(1, maxB);
      correctAnswer = a + b;
      question = `${a} + ${b} = ?`;
      if (grade === 1 && a + b > 10) hint = `Try counting up from ${Math.max(a, b)}`;
      break;
    }
    case 'subtraction': {
      a = randInt(1, maxA);
      b = randInt(1, Math.min(a, maxB));
      correctAnswer = a - b;
      question = `${a} - ${b} = ?`;
      if (grade === 1) hint = `Try counting down from ${a}`;
      break;
    }
    case 'multiplication': {
      const multMax = config.maxMultiply ?? 10;
      a = randInt(2, multMax);
      b = randInt(2, multMax);
      correctAnswer = a * b;
      question = `${a} × ${b} = ?`;
      hint = `${a} groups of ${b}`;
      break;
    }
    case 'division': {
      const multMax = config.maxMultiply ?? 10;
      b = randInt(2, multMax);
      correctAnswer = randInt(2, multMax);
      a = b * correctAnswer;
      question = `${a} ÷ ${b} = ?`;
      hint = `How many groups of ${b} are in ${a}?`;
      break;
    }
  }

  return {
    id: randomUUID(),
    question,
    correctAnswer,
    grade,
    operation,
    hint,
  };
}
