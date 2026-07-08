import express, { type Express } from "express";
import cors from "cors";
import { createQuiz, readAiConfig, isAiConfigured, type AiConfig } from "./quizService.js";
import { validateQuizRequest } from "./validation.js";

export interface AppOptions {
  aiConfig?: AiConfig;
}

/** Create the Express app. Kept separate from server bootstrap for testing. */
export function createApp(options: AppOptions = {}): Express {
  const aiConfig = options.aiConfig ?? readAiConfig();
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", ai: isAiConfigured(aiConfig) });
  });

  app.post("/api/quiz", async (req, res) => {
    const { value, error } = validateQuizRequest(req.body);
    if (error || !value) {
      res.status(400).json({ error });
      return;
    }
    try {
      const quiz = await createQuiz(value, aiConfig);
      res.json(quiz);
    } catch (err) {
      res.status(500).json({ error: "Failed to generate a quiz. Please try again." });
    }
  });

  return app;
}
