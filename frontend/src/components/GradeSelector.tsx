import type { Grade } from '../types'
import './GradeSelector.css'

interface GradeSelectorProps {
  onSelect: (grade: Grade) => void
}

const GRADE_INFO: Record<
  Grade,
  { emoji: string; title: string; topics: string; color: string }
> = {
  1: {
    emoji: '🌱',
    title: '1st Grade',
    topics: 'Addition & Subtraction up to 20',
    color: '#4ade80',
  },
  2: {
    emoji: '🌟',
    title: '2nd Grade',
    topics: 'Addition & Subtraction up to 100',
    color: '#60a5fa',
  },
  3: {
    emoji: '🚀',
    title: '3rd Grade',
    topics: 'Multiplication & Division',
    color: '#f472b6',
  },
  4: {
    emoji: '🏆',
    title: '4th Grade',
    topics: 'Multi-digit operations & Fractions',
    color: '#fb923c',
  },
}

export default function GradeSelector({ onSelect }: GradeSelectorProps) {
  return (
    <div className="grade-selector">
      <h2>Choose Your Grade</h2>
      <p className="grade-selector-subtitle">
        Pick the right level for you!
      </p>
      <div className="grade-grid">
        {([1, 2, 3, 4] as Grade[]).map((grade) => {
          const info = GRADE_INFO[grade]
          return (
            <button
              key={grade}
              className="grade-card"
              style={{ '--grade-color': info.color } as React.CSSProperties}
              onClick={() => onSelect(grade)}
            >
              <span className="grade-emoji">{info.emoji}</span>
              <span className="grade-title">{info.title}</span>
              <span className="grade-topics">{info.topics}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
