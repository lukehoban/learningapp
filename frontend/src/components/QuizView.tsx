import { useState } from "react";
import type { Quiz } from "../types";

interface Props {
  quiz: Quiz;
  onFinish: (score: number) => void;
}

export function QuizView({ quiz, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const question = quiz.questions[index];
  const isLast = index === quiz.questions.length - 1;
  const answered = selected !== null;

  function choose(optionIndex: number) {
    if (answered) return; // lock answer once chosen
    setSelected(optionIndex);
    if (optionIndex === question.answerIndex) {
      setScore((s) => s + 1);
    }
  }

  function next() {
    if (isLast) {
      onFinish(score);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function optionClass(optionIndex: number): string {
    if (!answered) return "option";
    if (optionIndex === question.answerIndex) return "option correct";
    if (optionIndex === selected) return "option incorrect";
    return "option";
  }

  return (
    <div className="card quiz">
      <div className="progress" data-testid="progress">
        Question {index + 1} of {quiz.questions.length}
      </div>

      <h2 className="question">{question.question}</h2>

      <div className="options" role="group" aria-label="Answer options">
        {question.options.map((option, i) => (
          <button
            key={i}
            type="button"
            className={optionClass(i)}
            onClick={() => choose(i)}
            disabled={answered}
          >
            {option}
          </button>
        ))}
      </div>

      {answered && (
        <div
          className={
            selected === question.answerIndex ? "feedback correct" : "feedback incorrect"
          }
          role="status"
        >
          <strong>
            {selected === question.answerIndex ? "Correct! 🎉" : "Not quite."}
          </strong>
          <p>{question.explanation}</p>
        </div>
      )}

      {answered && (
        <button type="button" className="primary" onClick={next}>
          {isLast ? "See my results" : "Next question"}
        </button>
      )}
    </div>
  );
}
