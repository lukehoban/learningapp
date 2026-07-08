import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Results, encouragement } from "../src/components/Results";

describe("encouragement", () => {
  it("celebrates a perfect score", () => {
    expect(encouragement(5, 5)).toMatch(/Perfect/);
  });

  it("encourages a low score", () => {
    expect(encouragement(1, 5)).toMatch(/try again/i);
  });

  it("handles an empty quiz safely", () => {
    expect(encouragement(0, 0)).toBeTruthy();
  });
});

describe("Results", () => {
  it("shows the score and restart button", async () => {
    const user = userEvent.setup();
    let restarted = false;
    render(
      <Results score={3} total={5} onRestart={() => (restarted = true)} />
    );

    expect(screen.getByTestId("score")).toHaveTextContent("3 out of 5");

    await user.click(screen.getByRole("button", { name: /try another quiz/i }));
    expect(restarted).toBe(true);
  });
});
