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

export interface AnswerCheckRequest {
  problemId: string;
  answer: number;
  correctAnswer: number;
  grade: Grade;
  operation: MathOperation;
  question: string;
}

export interface AnswerResult {
  correct: boolean;
  feedback: string;
  encouragement: string;
  correctAnswer: number;
}
