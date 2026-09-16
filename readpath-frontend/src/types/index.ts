// ─── Core Types ─────────────────────────────────────────────────────────────

export type Role = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN'

export type Grade =
  | 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'GRADE_4'
  | 'GRADE_5' | 'GRADE_6' | 'GRADE_7' | 'GRADE_8'
  | 'GRADE_9' | 'GRADE_10' | 'GRADE_11' | 'GRADE_12'

export type SkillArea =
  | 'PHONEMIC_AWARENESS'
  | 'PHONICS_DECODING'
  | 'FLUENCY'
  | 'VOCABULARY'
  | 'COMPREHENSION'

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED'

export type BadgeType =
  | 'VOCABULARY_EXPLORER'
  | 'FLUENCY_STARTER'
  | 'COMPREHENSION_MASTER'
  | 'STREAK_WARRIOR'
  | 'PAGES_READ_100'
  | 'PAGES_READ_500'
  | 'PERFECT_SCORE'
  | 'IMPROVEMENT_CHAMPION'

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  role: Role
  status: 'PENDING' | 'PAYMENT_PENDING' | 'ACTIVE' | 'SUSPENDED'
  profile: StudentProfile | ParentProfile | TeacherProfile | AdminProfile
}

export interface StudentProfile {
  id: string
  firstName: string
  lastName: string
  grade: Grade
  xp: number
  level: number
  streakDays: number
  lastActiveAt: string
}

export interface ParentProfile {
  id: string
  firstName: string
  lastName: string
}

export interface TeacherProfile {
  id: string
  firstName: string
  lastName: string
}

export interface AdminProfile {
  id: string
  firstName: string
  lastName: string
}

// ─── Assessment ──────────────────────────────────────────────────────────────

export interface Question {
  id: string
  skillArea: SkillArea
  subskill: string
  questionText: string
  questionType: 'multiple_choice' | 'fill_blank' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string
  explanation?: string
  grade: Grade
  difficulty: DifficultyLevel
  passageId?: string
}

export interface Passage {
  id: string
  title: string
  content: string
  grade: Grade
  difficulty: DifficultyLevel
  topic?: string
  wordCount: number
}

// ─── Reading Profile ──────────────────────────────────────────────────────────

export interface StrengthItem {
  skill: string
  score: number
  message: string
}

export interface WeaknessItem {
  skill: string
  score: number
  message: string
}

export interface RecommendationItem {
  skill: string
  activities: string[]
  message: string
}

export interface ReadingProfile {
  id: string
  studentId: string
  assessmentId: string
  readinessScore: number
  currentGrade: Grade
  targetGrade: Grade
  phonemicAwarenessScore: number
  phonicsDecodingScore: number
  fluencyScore: number
  vocabularyScore: number
  comprehensionScore: number
  strengths: StrengthItem[]
  weaknesses: WeaknessItem[]
  priorities: string[]
  recommendations: RecommendationItem[]
  createdAt: string
}

// ─── Learning Plan ────────────────────────────────────────────────────────────

export interface LearningActivity {
  id: string
  skillArea: SkillArea
  title: string
  description: string
  order: number
  completed: boolean
  completedAt?: string
}

export interface LearningWeek {
  id: string
  weekNumber: number
  title: string
  goals: string[]
  activities: LearningActivity[]
}

export interface LearningPlan {
  id: string
  title: string
  durationWeeks: number
  status: string
  weeks: LearningWeek[]
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  message: string
  createdAt: string
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ProgressLog {
  id: string
  metric: string
  value: number
  date: string
}

// ─── Badges ──────────────────────────────────────────────────────────────────

export interface StudentBadge {
  id: string
  badgeType: BadgeType
  earnedAt: string
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface StudentDashboardData {
  student: StudentProfile
  readinessScore: number | null
  targetGrade: string
  skillScores: {
    phonemicAwareness: number
    phonicsDecoding: number
    fluency: number
    vocabulary: number
    comprehension: number
  } | null
  latestProfile: ReadingProfile | null
  learningPlan: LearningPlan | null
  badges: StudentBadge[]
  hasCompletedAssessment: boolean
  assignments: {
    id: string
    contentType: string
    contentId: string
    contentTitle: string
    grade: string
    assignedAt: string
    dueDate?: string | null
    note?: string | null
  }[]
  recentActivity: {
    id: string
    metric: string
    value: number
    date: string
    metadata?: string | null
  }[]
}
