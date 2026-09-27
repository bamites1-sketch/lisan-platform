import { skillLabel, skillEmoji, scoreStatusLabel, scoreColor, scoreStatus } from '../../lib/utils'
import type { SkillArea } from '../../types'

interface Props {
  skill: SkillArea
  score: number
  onClick?: () => void
}

export default function SkillCard({ skill, score, onClick }: Props) {
  const status = scoreStatus(score)

  const statusStyles = {
    'strong':         'bg-[#e8f4f0] border-[#2d6a4f]/30 text-[#1a3a2a]',
    'developing':     'bg-[#fef8e7] border-[#d4a017]/40 text-[#936605]',
    'needs-practice': 'bg-rose-50   border-rose-200   text-rose-700',
  }[status]

  const barStyles = {
    'strong':         'bg-[#2d6a4f]',
    'developing':     'bg-[#d4a017]',
    'needs-practice': 'bg-rose-500',
  }[status]

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#1a3a2a]/10 p-4 transition-all duration-200 shadow-xs ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-[#2d6a4f]/35 hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{skillEmoji(skill)}</span>
          <span className="text-sm font-bold text-[#1a3a2a]">{skillLabel(skill)}</span>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusStyles}`}>
          {scoreStatusLabel(score)}
        </span>
      </div>

      <div className="flex items-end gap-1.5 mb-3">
        <span className="text-3xl font-extrabold text-[#1a3a2a]">{score}</span>
        <span className="text-xs text-gray-400 font-medium mb-1">/100</span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barStyles}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
