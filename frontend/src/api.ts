import type { Quiz, QuizRequest } from "./types";

/** Request a quiz from the API. Throws with a friendly message on failure. */
export async function fetchQuiz(req: QuizRequest): Promise<Quiz> {
  let res: Response;
  try {
    res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    throw new Error("Could not reach the learning server. Is it running?");
  }

  if (!res.ok) {
    let message = "Something went wrong generating your quiz.";
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // keep the default message
    }
    throw new Error(message);
  }

  return (await res.json()) as Quiz;
}
