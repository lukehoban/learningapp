export type Grade = 1 | 2 | 3 | 4;

export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathProblem {
  id: string;
  question: string;
  correctAnswer: number;
  grade: Grade;
  operation: MathOperation;
  hint?: string;
}

export interface AnswerResult {
  correct: boolean;
  feedback: string;
  encouragement: string;
  correctAnswer: number;
}

export interface SessionStats {
  grade: Grade;
  correct: number;
  incorrect: number;
  streak: number;
  totalProblems: number;
}
