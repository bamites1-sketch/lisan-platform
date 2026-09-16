import { skillLabel, skillEmoji, scoreStatusLabel, scoreColor, scoreStatus } from '../../lib/utils'
import type { SkillArea } from '../../types'

interface Props {
  skill: SkillArea
  score: number
  onClick?: () => void
}

export default function SkillCard({ skill, score, onClick }: Props) {
  const status = scoreStatus(score)
  const color = scoreColor(score)

  const statusStyles = {
    'strong':         'bg-success-50  border-success-200  text-success-700',
    'developing':     'bg-warning-50  border-warning-200  text-warning-700',
    'needs-practice': 'bg-danger-50   border-danger-200   text-danger-700',
  }[status]

  const barStyles = {
    'strong':         'bg-success-500',
    'developing':     'bg-warning-500',
    'needs-practice': 'bg-danger-500',
  }[status]

  return (
    <div
      onClick={onClick}
      className={`card border transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{skillEmoji(skill)}</span>
          <span className="text-sm font-semibold text-gray-800">{skillLabel(skill)}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusStyles}`}>
          {scoreStatusLabel(score)}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
        <span className="text-sm text-gray-400 mb-1">/100</span>
      </div>

      <div className="progress-bar">
        <div
          className={`progress-fill ${barStyles}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
