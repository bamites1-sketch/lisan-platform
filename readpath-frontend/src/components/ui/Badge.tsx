import { badgeEmoji, badgeLabel } from '../../lib/utils'
import type { BadgeType } from '../../types'

interface Props {
  badgeType: BadgeType
  earnedAt?: string
  size?: 'sm' | 'md'
}

export default function Badge({ badgeType, earnedAt, size = 'md' }: Props) {
  if (size === 'sm') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
        <span className="text-sm">{badgeEmoji(badgeType)}</span>
        <span className="text-xs font-semibold text-amber-800">{badgeLabel(badgeType)}</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-center min-w-[80px]">
      <span className="text-2xl">{badgeEmoji(badgeType)}</span>
      <span className="text-xs font-semibold text-amber-800 leading-tight">{badgeLabel(badgeType)}</span>
      {earnedAt && (
        <span className="text-[10px] text-gray-400">
          {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  )
}
