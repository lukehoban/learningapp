import { useState, type FormEvent } from "react";
import type { Difficulty, QuizRequest } from "../types";

const TOPIC_SUGGESTIONS = [
  "Math",
  "Science",
  "Animals",
  "Geography",
  "Space",
  "History",
];

interface Props {
  loading: boolean;
  onStart: (req: QuizRequest) => void;
}

export function SetupForm({ loading, onStart }: Props) {
  const [topic, setTopic] = useState("Math");
  const [grade, setGrade] = useState(3);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) return;
    onStart({ topic: trimmed, grade, count, difficulty });
  }

  return (
    <form className="card setup" onSubmit={handleSubmit}>
      <h2>Start a new quiz</h2>

      <label htmlFor="topic">What do you want to learn about?</label>
      <input
        id="topic"
        list="topic-suggestions"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="e.g. Math, Dinosaurs, Space…"
        maxLength={100}
        required
      />
      <datalist id="topic-suggestions">
        {TOPIC_SUGGESTIONS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <label htmlFor="grade">Grade level: {grade}</label>
      <input
        id="grade"
        type="range"
        min={1}
        max={12}
        value={grade}
        onChange={(e) => setGrade(Number(e.target.value))}
      />

      <label htmlFor="count">Number of questions</label>
      <select
        id="count"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
      >
        {[3, 5, 8, 10].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <label htmlFor="difficulty">Difficulty</label>
      <select
        id="difficulty"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>

      <button type="submit" className="primary" disabled={loading}>
        {loading ? "Creating your quiz…" : "Start learning!"}
      </button>
    </form>
  );
}
