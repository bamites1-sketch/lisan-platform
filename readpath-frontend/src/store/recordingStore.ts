// Voice Recording Store
// Stores fluency recordings made during assessments.
// In production, audioBlob would be uploaded to object storage and audioUrl stored.

export interface FluencyRecording {
  id: string
  studentId: string
  studentName: string
  studentGrade: string
  teacherId?: string
  passageId: string
  passageTitle: string
  audioBlob?: Blob          // in-memory blob for demo (cleared on page refresh)
  audioUrl?: string         // object URL created from blob, for <audio> playback
  durationSeconds: number
  recordedAt: string

  // Analysis metrics
  wpm: number               // words per minute
  accuracy: number          // 0-100
  cwpm: number              // correct words per minute
  totalWords: number
  pauseCount: number
  hesitationCount: number
  score: number             // 0-100 fluency score

  // Assignment link
  assignmentId?: string   // which assigned passage this belongs to
  studentNote?: string    // optional note from student on submission

  // Teacher review
  reviewed: boolean
  teacherNote?: string
  teacherRating?: 1 | 2 | 3 | 4 | 5
  flagged?: boolean
}

const uid  = () => `rec_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
const now  = () => new Date().toISOString()
const dago = (d: number) => new Date(Date.now() - d * 86400000).toISOString()

// Seed with realistic demo recordings (no blobs — demo uses mock audio URL)
let recordings: FluencyRecording[] = [
  {
    id: 'r1', studentId: 'profile-sara', studentName: 'Sara Tadesse', studentGrade: 'GRADE_6',
    teacherId: 't1', passageId: 'ps3', passageTitle: 'The Market Morning',
    audioUrl: undefined,  // will be set when student records
    durationSeconds: 62, recordedAt: dago(5),
    wpm: 98, accuracy: 91, cwpm: 89, totalWords: 101, pauseCount: 4, hesitationCount: 2,
    score: 72, reviewed: true, teacherNote: 'Good pacing. Work on expression.', teacherRating: 3,
  },
  {
    id: 'r2', studentId: 'profile-hana', studentName: 'Hana Girma', studentGrade: 'GRADE_7',
    teacherId: 't1', passageId: 'ps2', passageTitle: 'The Great Rift Valley',
    audioUrl: undefined,
    durationSeconds: 85, recordedAt: dago(3),
    wpm: 72, accuracy: 83, cwpm: 60, totalWords: 101, pauseCount: 9, hesitationCount: 5,
    score: 55, reviewed: false,
  },
  {
    id: 'r3', studentId: 'student-abel', studentName: 'Abel Haile', studentGrade: 'GRADE_5',
    teacherId: 't1', passageId: 'ps1', passageTitle: 'The Ethiopian Highlands',
    audioUrl: undefined,
    durationSeconds: 110, recordedAt: dago(1),
    wpm: 55, accuracy: 78, cwpm: 43, totalWords: 101, pauseCount: 14, hesitationCount: 8,
    score: 38, reviewed: false,
  },
  {
    id: 'r4', studentId: 'profile-dawit', studentName: 'Dawit Bekele', studentGrade: 'GRADE_6',
    teacherId: 't1', passageId: 'ps3', passageTitle: 'The Market Morning',
    audioUrl: undefined,
    durationSeconds: 51, recordedAt: dago(0),
    wpm: 119, accuracy: 95, cwpm: 113, totalWords: 101, pauseCount: 1, hesitationCount: 1,
    score: 88, reviewed: false,
  },
]

export const recordingStore = {
  getAll: (): FluencyRecording[] =>
    [...recordings].sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),

  getForStudent: (studentId: string): FluencyRecording[] =>
    recordings.filter(r => r.studentId === studentId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),

  getForTeacher: (teacherId: string): FluencyRecording[] =>
    recordings.filter(r => r.teacherId === teacherId)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),

  getUnreviewedCount: (teacherId: string): number =>
    recordings.filter(r => r.teacherId === teacherId && !r.reviewed).length,

  save: (data: Omit<FluencyRecording, 'id' | 'recordedAt'>): FluencyRecording => {
    // Create object URL from blob for immediate playback
    const audioUrl = data.audioBlob ? URL.createObjectURL(data.audioBlob) : undefined
    const item: FluencyRecording = { ...data, id: uid(), recordedAt: now(), audioUrl }
    recordings = [item, ...recordings]
    return item
  },

  addReview: (id: string, note: string, rating: 1 | 2 | 3 | 4 | 5, flagged?: boolean) => {
    recordings = recordings.map(r =>
      r.id === id ? { ...r, reviewed: true, teacherNote: note, teacherRating: rating, flagged: flagged ?? false } : r
    )
    return recordings.find(r => r.id === id)
  },

  delete: (id: string) => {
    const rec = recordings.find(r => r.id === id)
    if (rec?.audioUrl) URL.revokeObjectURL(rec.audioUrl)
    recordings = recordings.filter(r => r.id !== id)
  },
}

// ─── Fluency score calculator ─────────────────────────────────────────────────
export function calculateFluencyScore(
  totalWords: number, durationSeconds: number, accuracy: number
): { wpm: number; cwpm: number; score: number; pauseCount: number } {
  const minutes = Math.max(durationSeconds / 60, 0.1)
  const wpm = Math.round(totalWords / minutes)
  const cwpm = Math.round(wpm * (accuracy / 100))

  // Scoring rubric: 50% accuracy + 50% rate (capped at grade-level target of 120 cwpm)
  const accuracyScore = accuracy * 0.5
  const rateScore = Math.min(cwpm, 120) / 120 * 50
  const score = Math.min(100, Math.round(accuracyScore + rateScore))

  // Estimate pauses from duration — longer than expected = more pauses
  const expectedDuration = (totalWords / 110) * 60  // 110 wpm target
  const pauseCount = Math.max(0, Math.round((durationSeconds - expectedDuration) / 3))

  return { wpm, cwpm, score, pauseCount }
}
