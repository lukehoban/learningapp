import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuizView } from "../src/components/QuizView";
import type { Quiz } from "../src/types";

const quiz: Quiz = {
  topic: "math",
  grade: 3,
  difficulty: "easy",
  source: "offline",
  questions: [
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answerIndex: 1,
      explanation: "2 + 2 = 4.",
    },
    {
      question: "What is 5 - 1?",
      options: ["2", "3", "4", "5"],
      answerIndex: 2,
      explanation: "5 - 1 = 4.",
    },
  ],
};

describe("QuizView", () => {
  it("shows progress and the first question", () => {
    render(<QuizView quiz={quiz} onFinish={() => {}} />);
    expect(screen.getByTestId("progress")).toHaveTextContent("Question 1 of 2");
    expect(screen.getByText("What is 2 + 2?")).toBeInTheDocument();
  });

  it("gives feedback and locks the answer after choosing", async () => {
    const user = userEvent.setup();
    render(<QuizView quiz={quiz} onFinish={() => {}} />);

    await user.click(screen.getByRole("button", { name: "4" }));

    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
    // All option buttons become disabled once answered.
    for (const label of ["3", "4", "5", "6"]) {
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    }
  });

  it("shows the explanation when the answer is wrong", async () => {
    const user = userEvent.setup();
    render(<QuizView quiz={quiz} onFinish={() => {}} />);

    await user.click(screen.getByRole("button", { name: "3" }));

    expect(screen.getByRole("status")).toHaveTextContent("Not quite.");
    expect(screen.getByText("2 + 2 = 4.")).toBeInTheDocument();
  });

  it("tallies the score and finishes after the last question", async () => {
    const user = userEvent.setup();
    let finalScore = -1;
    render(<QuizView quiz={quiz} onFinish={(s) => (finalScore = s)} />);

    // Q1 correct
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));

    // Q2 correct (answer index 2 -> "4")
    expect(screen.getByText("What is 5 - 1?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "See my results" }));

    expect(finalScore).toBe(2);
  });
});
