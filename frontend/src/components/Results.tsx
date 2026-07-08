interface Props {
  score: number;
  total: number;
  onRestart: () => void;
}

/** Choose an encouraging message based on how the learner did. */
export function encouragement(score: number, total: number): string {
  if (total === 0) return "Ready when you are!";
  const ratio = score / total;
  if (ratio === 1) return "Perfect score! You're a superstar! 🌟";
  if (ratio >= 0.7) return "Great job! You really know your stuff. 💪";
  if (ratio >= 0.4) return "Nice effort — a little more practice and you've got it! 👍";
  return "Every expert was once a beginner. Let's try again! 🚀";
}

export function Results({ score, total, onRestart }: Props) {
  return (
    <div className="card results">
      <h2>Quiz complete!</h2>
      <p className="score" data-testid="score">
        You got {score} out of {total} correct.
      </p>
      <p className="message">{encouragement(score, total)}</p>
      <button type="button" className="primary" onClick={onRestart}>
        Try another quiz
      </button>
    </div>
  );
}
