import type { AnswerResult } from '../types'
import './FeedbackDisplay.css'

interface FeedbackDisplayProps {
  result: AnswerResult
  onNext: () => void
  isLastProblem: boolean
}

export default function FeedbackDisplay({
  result,
  onNext,
  isLastProblem,
}: FeedbackDisplayProps) {
  return (
    <div
      className={`feedback-card ${result.correct ? 'feedback-correct' : 'feedback-incorrect'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="feedback-icon">
        {result.correct ? '🎉' : '🤔'}
      </div>

      <h3 className="feedback-status">
        {result.correct ? 'Correct!' : 'Not quite!'}
      </h3>

      {!result.correct && (
        <p className="feedback-answer">
          The answer was <strong>{result.correctAnswer}</strong>
        </p>
      )}

      <p className="feedback-message">{result.feedback}</p>

      <p className="feedback-encouragement">{result.encouragement}</p>

      <button className="btn-primary next-btn" onClick={onNext}>
        {isLastProblem ? 'See Results 🏁' : 'Next Problem →'}
      </button>
    </div>
  )
}
