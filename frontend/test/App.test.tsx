import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../src/App";
import type { Quiz } from "../src/types";

const sampleQuiz: Quiz = {
  topic: "Math",
  grade: 3,
  difficulty: "easy",
  source: "offline",
  questions: [
    {
      question: "What is 1 + 1?",
      options: ["1", "2", "3", "4"],
      answerIndex: 1,
      explanation: "1 + 1 = 2.",
    },
  ],
};

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs a full quiz flow from setup to results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => sampleQuiz,
      })) as unknown as typeof fetch
    );

    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("Start a new quiz")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /start learning/i }));

    await waitFor(() =>
      expect(screen.getByText("What is 1 + 1?")).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: /see my results/i }));

    expect(screen.getByTestId("score")).toHaveTextContent("1 out of 1");
  });

  it("shows an error message when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "`topic` is required." }),
      })) as unknown as typeof fetch
    );

    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start learning/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("`topic` is required.")
    );
  });
});
