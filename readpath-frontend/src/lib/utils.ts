import type { Grade, SkillArea, BadgeType } from '../types'

export function gradeLabel(grade: Grade): string {
  return `Grade ${parseInt(grade.replace('GRADE_', ''))}`
}

export function scoreStatus(score: number): 'strong' | 'developing' | 'needs-practice' {
  if (score >= 75) return 'strong'
  if (score >= 60) return 'developing'
  return 'needs-practice'
}

export function scoreStatusLabel(score: number): string {
  if (score >= 75) return 'Strong'
  if (score >= 60) return 'Developing'
  return 'Needs Practice'
}

export function scoreColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

export function scoreTextClass(score: number): string {
  if (score >= 75) return 'text-success-600'
  if (score >= 60) return 'text-warning-600'
  return 'text-danger-600'
}

export function skillLabel(skill: SkillArea): string {
  const map: Record<SkillArea, string> = {
    PHONEMIC_AWARENESS: 'Phonemic Awareness',
    PHONICS_DECODING: 'Phonics & Decoding',
    FLUENCY: 'Reading Fluency',
    VOCABULARY: 'Vocabulary',
    COMPREHENSION: 'Comprehension',
  }
  return map[skill]
}

export function skillEmoji(skill: SkillArea): string {
  const map: Record<SkillArea, string> = {
    PHONEMIC_AWARENESS: '🔊',
    PHONICS_DECODING: '🔤',
    FLUENCY: '🎤',
    VOCABULARY: '📚',
    COMPREHENSION: '🧠',
  }
  return map[skill]
}

export function badgeLabel(badge: BadgeType): string {
  const map: Record<BadgeType, string> = {
    VOCABULARY_EXPLORER: 'Vocabulary Explorer',
    FLUENCY_STARTER: 'Fluency Starter',
    COMPREHENSION_MASTER: 'Comprehension Master',
    STREAK_WARRIOR: '7-Day Streak',
    PAGES_READ_100: '100 Pages Read',
    PAGES_READ_500: '500 Pages Read',
    PERFECT_SCORE: 'Perfect Score',
    IMPROVEMENT_CHAMPION: 'Improvement Champion',
  }
  return map[badge]
}

export function badgeEmoji(badge: BadgeType): string {
  const map: Record<BadgeType, string> = {
    VOCABULARY_EXPLORER: '🏆',
    FLUENCY_STARTER: '🎤',
    COMPREHENSION_MASTER: '🧠',
    STREAK_WARRIOR: '🔥',
    PAGES_READ_100: '📖',
    PAGES_READ_500: '📚',
    PERFECT_SCORE: '⭐',
    IMPROVEMENT_CHAMPION: '📈',
  }
  return map[badge]
}

export function gradeOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: `GRADE_${i + 1}`,
    label: `Grade ${i + 1}`,
  }))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const mins  = Math.floor(diff / 60000)
  if (days  > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins  > 0) return `${mins}m ago`
  return 'just now'
}
