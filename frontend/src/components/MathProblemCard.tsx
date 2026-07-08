import { useState, useRef, useEffect } from 'react'
import type { MathProblem } from '../types'
import './MathProblemCard.css'

interface MathProblemCardProps {
  problem: MathProblem
  onSubmit: (answer: number) => Promise<void>
  loading: boolean
}

export default function MathProblemCard({
  problem,
  onSubmit,
  loading,
}: MathProblemCardProps) {
  const [inputValue, setInputValue] = useState('')
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when problem changes
  useEffect(() => {
    setInputValue('')
    setShowHint(false)
    inputRef.current?.focus()
  }, [problem.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const answer = parseFloat(inputValue)
    if (isNaN(answer)) return
    await onSubmit(answer)
  }

  return (
    <div className="problem-card">
      <div className="problem-header">
        <span className="operation-badge">{getOperationEmoji(problem.operation)}</span>
        <span className="operation-label">{capitalize(problem.operation)}</span>
      </div>

      <div className="problem-question" aria-live="polite">
        {problem.question}
      </div>

      <form onSubmit={handleSubmit} className="answer-form">
        <input
          ref={inputRef}
          type="number"
          className="answer-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Your answer"
          disabled={loading}
          aria-label="Your answer"
        />
        <button
          type="submit"
          className="btn-primary submit-btn"
          disabled={loading || inputValue.trim() === ''}
        >
          {loading ? '🤔 Checking...' : 'Check! ✓'}
        </button>
      </form>

      {problem.hint && (
        <div className="hint-section">
          <button
            className="hint-toggle"
            onClick={() => setShowHint(!showHint)}
            type="button"
          >
            {showHint ? '🙈 Hide hint' : '💡 Show hint'}
          </button>
          {showHint && <p className="hint-text">{problem.hint}</p>}
        </div>
      )}
    </div>
  )
}

function getOperationEmoji(op: MathProblem['operation']): string {
  switch (op) {
    case 'addition': return '➕'
    case 'subtraction': return '➖'
    case 'multiplication': return '✖️'
    case 'division': return '➗'
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
