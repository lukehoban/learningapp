export type Difficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface Quiz {
  topic: string;
  grade: number;
  difficulty: Difficulty;
  questions: QuizQuestion[];
  source: "ai" | "offline";
}

export interface QuizRequest {
  topic: string;
  grade: number;
  count: number;
  difficulty: Difficulty;
}
