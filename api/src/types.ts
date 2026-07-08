export type Difficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  /** The question prompt shown to the learner. */
  question: string;
  /** Multiple choice options. */
  options: string[];
  /** Index into `options` for the correct answer. */
  answerIndex: number;
  /** A short, kid-friendly explanation of the correct answer. */
  explanation: string;
}

export interface QuizRequest {
  topic: string;
  grade: number;
  count: number;
  difficulty: Difficulty;
}

export interface Quiz {
  topic: string;
  grade: number;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  /** Where the questions came from: the AI model or the offline generator. */
  source: "ai" | "offline";
}
