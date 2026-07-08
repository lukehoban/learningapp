import { useState, useCallback } from 'react'
import GradeSelector from './components/GradeSelector'
import MathProblemCard from './components/MathProblemCard'
import ProgressTracker from './components/ProgressTracker'
import FeedbackDisplay from './components/FeedbackDisplay'
import { useMathSession } from './hooks/useMathSession'
import type { Grade } from './types'
import './App.css'

type AppState = 'grade-select' | 'playing' | 'session-complete'

export default function App() {
  const [appState, setAppState] = useState<AppState>('grade-select')
  const [selectedGrade, setSelectedGrade] = useState<Grade>(1)

  const {
    currentProblem,
    lastResult,
    stats,
    loading,
    error,
    submitAnswer,
    nextProblem,
    resetSession,
  } = useMathSession(selectedGrade)

  const handleGradeSelect = useCallback(
    (grade: Grade) => {
      setSelectedGrade(grade)
      resetSession()
      setAppState('playing')
    },
    [resetSession],
  )

  const handleAnswerSubmit = useCallback(
    async (answer: number) => {
      await submitAnswer(answer)
    },
    [submitAnswer],
  )

  const handleNext = useCallback(() => {
    if (stats.totalProblems >= 10) {
      setAppState('session-complete')
    } else {
      nextProblem()
    }
  }, [stats.totalProblems, nextProblem])

  const handlePlayAgain = useCallback(() => {
    resetSession()
    setAppState('grade-select')
  }, [resetSession])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🧮 Math Adventure</h1>
        <p className="tagline">Learn math the fun way!</p>
      </header>

      <main className="app-main">
        {appState === 'grade-select' && (
          <GradeSelector onSelect={handleGradeSelect} />
        )}

        {appState === 'playing' && (
          <div className="playing-layout">
            <ProgressTracker stats={stats} grade={selectedGrade} />

            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}

            {currentProblem && !lastResult && (
              <MathProblemCard
                problem={currentProblem}
                onSubmit={handleAnswerSubmit}
                loading={loading}
              />
            )}

            {lastResult && (
              <FeedbackDisplay
                result={lastResult}
                onNext={handleNext}
                isLastProblem={stats.totalProblems >= 10}
              />
            )}
          </div>
        )}

        {appState === 'session-complete' && (
          <div className="session-complete">
            <div className="complete-card">
              <div className="complete-emoji">
                {stats.correct >= 8 ? '🏆' : stats.correct >= 6 ? '⭐' : '💪'}
              </div>
              <h2>Session Complete!</h2>
              <p className="grade-label">Grade {selectedGrade}</p>
              <div className="final-score">
                <span className="score-correct">{stats.correct}</span>
                <span className="score-divider"> / </span>
                <span className="score-total">{stats.totalProblems}</span>
                <span className="score-label"> correct</span>
              </div>
              <p className="score-message">
                {stats.correct >= 8
                  ? '🎉 Amazing work! You\'re a math superstar!'
                  : stats.correct >= 6
                  ? '⭐ Great job! Keep practicing!'
                  : '💪 Good effort! Practice makes perfect!'}
              </p>
              <button className="btn-primary" onClick={handlePlayAgain}>
                Play Again 🚀
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
