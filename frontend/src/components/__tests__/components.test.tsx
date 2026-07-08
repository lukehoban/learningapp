import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GradeSelector from '../GradeSelector'
import FeedbackDisplay from '../FeedbackDisplay'
import ProgressTracker from '../ProgressTracker'
import type { AnswerResult, SessionStats } from '../../types'

// ===== GradeSelector =====
describe('GradeSelector', () => {
  it('renders all four grade options', () => {
    const onSelect = vi.fn()
    render(<GradeSelector onSelect={onSelect} />)
    expect(screen.getByText('1st Grade')).toBeInTheDocument()
    expect(screen.getByText('2nd Grade')).toBeInTheDocument()
    expect(screen.getByText('3rd Grade')).toBeInTheDocument()
    expect(screen.getByText('4th Grade')).toBeInTheDocument()
  })

  it('calls onSelect with the correct grade when clicked', () => {
    const onSelect = vi.fn()
    render(<GradeSelector onSelect={onSelect} />)
    fireEvent.click(screen.getByText('2nd Grade'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })
})

// ===== FeedbackDisplay =====
describe('FeedbackDisplay', () => {
  const correctResult: AnswerResult = {
    correct: true,
    feedback: 'Well done! 5 + 3 = 8.',
    encouragement: 'You are on fire!',
    correctAnswer: 8,
  }

  const wrongResult: AnswerResult = {
    correct: false,
    feedback: 'Not quite. 5 + 3 = 8, not 9.',
    encouragement: 'Keep trying!',
    correctAnswer: 8,
  }

  it('shows correct feedback for a right answer', () => {
    render(<FeedbackDisplay result={correctResult} onNext={vi.fn()} isLastProblem={false} />)
    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText(correctResult.feedback)).toBeInTheDocument()
  })

  it('shows correct answer when wrong', () => {
    render(<FeedbackDisplay result={wrongResult} onNext={vi.fn()} isLastProblem={false} />)
    expect(screen.getByText('Not quite!')).toBeInTheDocument()
    expect(screen.getByText(/The answer was/)).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
  })

  it('shows "See Results" on last problem', () => {
    render(<FeedbackDisplay result={correctResult} onNext={vi.fn()} isLastProblem={true} />)
    expect(screen.getByText(/See Results/)).toBeInTheDocument()
  })

  it('shows "Next Problem" on intermediate problems', () => {
    render(<FeedbackDisplay result={correctResult} onNext={vi.fn()} isLastProblem={false} />)
    expect(screen.getByText(/Next Problem/)).toBeInTheDocument()
  })

  it('calls onNext when the next button is clicked', () => {
    const onNext = vi.fn()
    render(<FeedbackDisplay result={correctResult} onNext={onNext} isLastProblem={false} />)
    fireEvent.click(screen.getByText(/Next Problem/))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})

// ===== ProgressTracker =====
describe('ProgressTracker', () => {
  const stats: SessionStats = {
    grade: 2,
    correct: 3,
    incorrect: 1,
    streak: 2,
    totalProblems: 4,
  }

  beforeEach(() => {
    render(<ProgressTracker stats={stats} grade={2} />)
  })

  it('displays the grade label', () => {
    expect(screen.getByText('2nd Grade')).toBeInTheDocument()
  })

  it('displays correct count', () => {
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('displays streak count', () => {
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays problem progress', () => {
    expect(screen.getByText(/Problem 5 of 10/)).toBeInTheDocument()
  })

  it('has accessible progress bar', () => {
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '4')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
  })
})
