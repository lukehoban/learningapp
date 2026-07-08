import type { SessionStats, Grade } from '../types'
import './ProgressTracker.css'

interface ProgressTrackerProps {
  stats: SessionStats
  grade: Grade
}

const GRADE_LABELS: Record<Grade, string> = {
  1: '1st Grade',
  2: '2nd Grade',
  3: '3rd Grade',
  4: '4th Grade',
}

export default function ProgressTracker({ stats, grade }: ProgressTrackerProps) {
  const progress = (stats.totalProblems / 10) * 100

  return (
    <div className="progress-tracker">
      <div className="progress-meta">
        <span className="grade-badge">{GRADE_LABELS[grade]}</span>
        <span className="problem-count">
          Problem {Math.min(stats.totalProblems + 1, 10)} of 10
        </span>
      </div>

      <div className="progress-bar-container" role="progressbar"
        aria-valuenow={stats.totalProblems}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-label={`${stats.totalProblems} of 10 problems completed`}>
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="stats-row">
        <div className="stat-item stat-correct">
          <span className="stat-emoji">✅</span>
          <span className="stat-value">{stats.correct}</span>
          <span className="stat-label">Correct</span>
        </div>

        <div className="stat-item stat-streak">
          <span className="stat-emoji">🔥</span>
          <span className="stat-value">{stats.streak}</span>
          <span className="stat-label">Streak</span>
        </div>

        <div className="stat-item stat-incorrect">
          <span className="stat-emoji">❌</span>
          <span className="stat-value">{stats.incorrect}</span>
          <span className="stat-label">Wrong</span>
        </div>
      </div>
    </div>
  )
}
