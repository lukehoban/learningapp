import { useState, useEffect, useCallback } from 'react'
import type { Grade, MathProblem, AnswerResult, SessionStats } from '../types'

interface UseMathSessionReturn {
  currentProblem: MathProblem | null
  lastResult: AnswerResult | null
  stats: SessionStats
  loading: boolean
  error: string | null
  submitAnswer: (answer: number) => Promise<void>
  nextProblem: () => void
  resetSession: () => void
}

function defaultStats(grade: Grade): SessionStats {
  return { grade, correct: 0, incorrect: 0, streak: 0, totalProblems: 0 }
}

export function useMathSession(grade: Grade): UseMathSessionReturn {
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null)
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [stats, setStats] = useState<SessionStats>(defaultStats(grade))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProblem = useCallback(async (currentStats: SessionStats) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/generateProblem?grade=${currentStats.grade}&correct=${currentStats.correct}&incorrect=${currentStats.incorrect}&streak=${currentStats.streak}`,
      )
      if (!response.ok) {
        throw new Error(`Failed to fetch problem: ${response.statusText}`)
      }
      const problem: MathProblem = await response.json()
      setCurrentProblem(problem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load problem')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load first problem when session starts
  useEffect(() => {
    const initialStats = defaultStats(grade)
    setStats(initialStats)
    setCurrentProblem(null)
    setLastResult(null)
    fetchProblem(initialStats)
  }, [grade, fetchProblem])

  const submitAnswer = useCallback(
    async (answer: number) => {
      if (!currentProblem) return
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/checkAnswer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: currentProblem.id,
            answer,
            correctAnswer: currentProblem.correctAnswer,
            grade: currentProblem.grade,
            operation: currentProblem.operation,
            question: currentProblem.question,
          }),
        })
        if (!response.ok) {
          throw new Error(`Failed to check answer: ${response.statusText}`)
        }
        const result: AnswerResult = await response.json()
        setLastResult(result)
        setStats((prev) => ({
          ...prev,
          correct: prev.correct + (result.correct ? 1 : 0),
          incorrect: prev.incorrect + (result.correct ? 0 : 1),
          streak: result.correct ? prev.streak + 1 : 0,
          totalProblems: prev.totalProblems + 1,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check answer')
      } finally {
        setLoading(false)
      }
    },
    [currentProblem],
  )

  const nextProblem = useCallback(() => {
    setLastResult(null)
    setCurrentProblem(null)
    fetchProblem(stats)
  }, [fetchProblem, stats])

  const resetSession = useCallback(() => {
    setCurrentProblem(null)
    setLastResult(null)
    setStats(defaultStats(grade))
  }, [grade])

  return {
    currentProblem,
    lastResult,
    stats,
    loading,
    error,
    submitAnswer,
    nextProblem,
    resetSession,
  }
}
