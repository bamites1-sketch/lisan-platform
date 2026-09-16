// Assignment Store
// Teachers and admins assign reading passages to students or grades.
// Students see their assignments on the Reading Practice page.
//
// NOTE: This is currently an in-memory store. For production, this should be
// replaced with real API calls to a backend assignment system that tracks:
// - Assignment creation and delivery
// - Per-student submission status
// - Recording linkage
// The backend has /api/admin/assignments (ContentAssignment) but it doesn't
// yet support the submission tracking needed here. Backend enhancement required.

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED'
export type AssignedGrade =
  | 'GRADE_5' | 'GRADE_6' | 'GRADE_7' | 'ALL'

export interface AssignedPassage {
  id: string
  passageId: string
  passageTitle: string
  passageText: string
  wordCount: number
  topic: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'

  // Who assigned it
  assignedBy: string          // teacher/admin id
  assignedByName: string
  assignedByRole: 'TEACHER' | 'ADMIN'
  assignedAt: string

  // Who it's for
  targetGrade: AssignedGrade   // or specific studentId
  targetStudentId?: string     // if individual assignment

  // Instructions
  instructions?: string
  dueDateLabel?: string        // e.g. "Due Friday"

  // Per-student submission status — keyed by studentId
  submissions: Record<string, AssignmentStatus>
  recordingIds: Record<string, string>    // studentId -> recordingId
}

const uid  = () => `asgn_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
const dago = (d: number) => new Date(Date.now() - d * 86400000).toISOString()

// ─── Seed data ────────────────────────────────────────────────────────────────
let assignments: AssignedPassage[] = [
  {
    id: 'asgn-1',
    passageId: 'fp-market',
    passageTitle: 'The Market Morning',
    passageText: `The farmers waited patiently for the rain. Every morning, Tigist walked to the edge of the field and looked at the sky. The dry season had lasted longer than anyone could remember. The soil cracked beneath her feet like old pottery.

One afternoon, a cool wind came from the north. Dark clouds gathered slowly over the mountains. By evening, the first drops fell on the dusty earth. Children ran outside with their hands raised, laughing and turning in circles as the rain began to fall.

Tigist stood at the door of her house and smiled. The long wait was finally over.`,
    wordCount: 101,
    topic: 'Nature & Community',
    difficulty: 'MEDIUM',
    assignedBy: 't1',
    assignedByName: 'Ms. Tigist Bekele',
    assignedByRole: 'TEACHER',
    assignedAt: dago(3),
    targetGrade: 'GRADE_6',
    instructions: 'Read clearly and at a steady pace. Focus on expression — pause at punctuation marks.',
    dueDateLabel: 'Due Friday',
    submissions: { 'profile-sara': 'REVIEWED', 'profile-dawit': 'SUBMITTED' },
    recordingIds: { 'profile-sara': 'r1', 'profile-dawit': 'r4' },
  },
  {
    id: 'asgn-2',
    passageId: 'fp-highlands',
    passageTitle: 'The Ethiopian Highlands',
    passageText: `Ethiopia is home to some of the most dramatic landscapes in Africa. The Ethiopian Highlands stretch across much of the country, with towering peaks and deep valleys carved by ancient rivers. The Blue Nile River, known locally as the Abbay, begins its long journey in the highlands near Lake Tana before flowing north toward Egypt.

Farmers in the highlands have cultivated the rich volcanic soil for thousands of years, growing crops like teff, barley, and wheat. The cool climate of the highlands makes it suitable for coffee cultivation, and Ethiopia is widely considered the birthplace of coffee. Today, coffee remains one of the country's most important exports.`,
    wordCount: 108,
    topic: 'Geography & Culture',
    difficulty: 'MEDIUM',
    assignedBy: 'admin-1',
    assignedByName: 'Admin',
    assignedByRole: 'ADMIN',
    assignedAt: dago(5),
    targetGrade: 'ALL',
    instructions: 'Read the full passage aloud. Pay attention to the longer geographic words.',
    dueDateLabel: 'Due next week',
    submissions: { 'student-abel': 'SUBMITTED' },
    recordingIds: { 'student-abel': 'r3' },
  },
  {
    id: 'asgn-3',
    passageId: 'fp-rift',
    passageTitle: 'The Great Rift Valley',
    passageText: `The Great Rift Valley is one of the most remarkable geological features on Earth. It stretches over 6,000 kilometers from the Afar Triangle in northern Ethiopia all the way down to Mozambique in southern Africa. Along its length, the valley contains volcanoes, hot springs, and some of the deepest lakes in the world.

In Ethiopia, the rift cuts through the heart of the country, creating a series of highland lakes surrounded by savanna grasslands. Flamingos gather in their thousands along the shores, and hippos wade in the shallow inlets. The valley is also home to important archaeological sites, including fossils of early human ancestors discovered near the Awash River.`,
    wordCount: 110,
    topic: 'Science & Geography',
    difficulty: 'HARD',
    assignedBy: 't1',
    assignedByName: 'Ms. Tigist Bekele',
    assignedByRole: 'TEACHER',
    assignedAt: dago(1),
    targetGrade: 'GRADE_7',
    instructions: 'This is a challenging passage — sound out any difficult words. Read at a comfortable pace.',
    dueDateLabel: 'Due Thursday',
    submissions: { 'profile-hana': 'SUBMITTED' },
    recordingIds: { 'profile-hana': 'r2' },
  },
  {
    id: 'asgn-4',
    passageId: 'fp-coffee',
    passageTitle: 'The Story of Coffee',
    passageText: `According to legend, a young goat herder named Kaldi first discovered coffee in the hills of Ethiopia over a thousand years ago. He noticed that his goats became unusually energetic after eating berries from a certain tree, and they would not sleep at night. Curious, Kaldi brought the berries to a local monastery, where a monk made a drink from them and found that it helped him stay awake during long evening prayers.

Word of the energizing berries spread quickly. From Ethiopia, coffee crossed the Red Sea to Yemen, where it was cultivated and traded. By the 1500s, it had reached Persia, Egypt, and Turkey. Today, billions of people around the world start their mornings with a cup of coffee — all tracing back to those hills in Ethiopia.`,
    wordCount: 130,
    topic: 'History & Culture',
    difficulty: 'MEDIUM',
    assignedBy: 'admin-1',
    assignedByName: 'Admin',
    assignedByRole: 'ADMIN',
    assignedAt: dago(0),
    targetGrade: 'GRADE_6',
    instructions: 'Read with expression. Think about how to make the story interesting for a listener.',
    dueDateLabel: 'Due next Monday',
    submissions: {},
    recordingIds: {},
  },
  {
    id: 'asgn-5',
    passageId: 'fp-water',
    passageTitle: 'Water and the Village',
    passageText: `For many children in rural Ethiopia, the day begins before sunrise. They wake early to walk long distances to collect water for their families. Some children carry heavy jerry cans for two or three hours each way. By the time they return home, there is little time left for school.

When a new well is dug near a village, everything changes. Children no longer need to spend their mornings walking for water. They can arrive at school on time, with energy to learn. Parents can spend more time working in their fields. The entire community benefits when clean water is close by.

Organizations working in Ethiopia have found that access to clean water is one of the most powerful ways to improve children's education and health at the same time.`,
    wordCount: 128,
    topic: 'Community & Development',
    difficulty: 'EASY',
    assignedBy: 't1',
    assignedByName: 'Ms. Tigist Bekele',
    assignedByRole: 'TEACHER',
    assignedAt: dago(2),
    targetGrade: 'GRADE_5',
    instructions: 'Read clearly and at a natural pace. Try to read the whole passage without stopping.',
    dueDateLabel: 'Due Wednesday',
    submissions: {},
    recordingIds: {},
  },
]

// ─── Store API ────────────────────────────────────────────────────────────────
export const assignmentStore = {
  /** All assignments (for admin view) */
  getAll: (): AssignedPassage[] =>
    [...assignments].sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()),

  /** Assignments visible to a student based on grade */
  getForStudent: (grade: string): AssignedPassage[] =>
    assignments
      .filter(a => a.targetGrade === 'ALL' || a.targetGrade === grade)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()),

  /** Assignments created by a teacher */
  getForTeacher: (teacherId: string): AssignedPassage[] =>
    assignments
      .filter(a => a.assignedBy === teacherId)
      .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()),

  getById: (id: string): AssignedPassage | undefined =>
    assignments.find(a => a.id === id),

  /** Student submits a recording */
  markSubmitted: (assignmentId: string, studentId: string, recordingId: string) => {
    assignments = assignments.map(a =>
      a.id === assignmentId
        ? {
            ...a,
            submissions: { ...a.submissions, [studentId]: 'SUBMITTED' },
            recordingIds: { ...a.recordingIds, [studentId]: recordingId },
          }
        : a
    )
  },

  /** Teacher marks as reviewed */
  markReviewed: (assignmentId: string, studentId: string) => {
    assignments = assignments.map(a =>
      a.id === assignmentId
        ? { ...a, submissions: { ...a.submissions, [studentId]: 'REVIEWED' } }
        : a
    )
  },

  /** Create a new assignment (teacher/admin) */
  create: (data: Omit<AssignedPassage, 'id' | 'submissions' | 'recordingIds'>): AssignedPassage => {
    const item: AssignedPassage = { ...data, id: uid(), submissions: {}, recordingIds: {} }
    assignments = [item, ...assignments]
    return item
  },

  delete: (id: string) => {
    assignments = assignments.filter(a => a.id !== id)
  },

  /** Count pending (not yet submitted) for a student */
  getPendingCount: (grade: string, studentId: string): number =>
    assignments
      .filter(a => a.targetGrade === 'ALL' || a.targetGrade === grade)
      .filter(a => !a.submissions[studentId] || a.submissions[studentId] === 'PENDING')
      .length,
}
