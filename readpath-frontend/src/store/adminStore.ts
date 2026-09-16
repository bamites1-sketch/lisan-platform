// In-memory admin store — mirrors what a real API would persist.
// All mutations are synchronous; swap out the functions for fetch() calls when backend is ready.

export type ReadinessStatus = 'READY' | 'DEVELOPING' | 'NEEDS_SUPPORT' | 'NOT_ASSESSED'

export interface AdminStudent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  grade: string        // 'GRADE_1' … 'GRADE_12'
  teacherId?: string
  parentId?: string
  score: number
  status: ReadinessStatus
  xp: number
  streakDays: number
  badges: number
  lastActive: string
  createdAt: string
  notes?: string
}

export interface AdminParent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  childrenIds: string[]
  active: boolean
  joinedAt: string
  notes?: string
}

export interface AdminTeacher {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  grades: string       // e.g. 'Grade 5–7'
  studentIds: string[]
  active: boolean
  joinedAt: string
  notes?: string
}

export interface AdminAdmin {
  id: string
  firstName: string
  lastName: string
  email: string
  role: 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'VIEWER'
  active: boolean
  joinedAt: string
}

export interface AdminPassage {
  id: string
  title: string
  grade: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED'
  topic: string
  wordCount: number
  content: string
  language: 'en' | 'am'
  createdAt: string
}

export interface AdminQuestion {
  id: string
  skillArea: string
  subskill: string
  questionText: string
  questionType: 'multiple_choice' | 'fill_blank' | 'true_false'
  options: string[]
  correctAnswer: string
  explanation: string
  grade: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED'
  passageId?: string
  createdAt: string
}

export interface AdminVocabulary {
  id: string
  word: string
  definition: string
  exampleSentence: string
  grade: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED'
  partOfSpeech: string
  synonyms: string
  antonyms: string
  amharicTranslation: string
  createdAt: string
}

export interface AdminLesson {
  id: string
  skillArea: string
  subskill: string
  title: string
  grade: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED'
  explanation: string
  tips: string
  order: number
  createdAt: string
}

// ─── Seed data ─────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString()
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

let students: AdminStudent[] = [
  { id: 's1', firstName: 'Sara',   lastName: 'Tadesse', email: 'sara@lisan.com',   grade: 'GRADE_6', teacherId: 't1', parentId: 'p1', score: 72, status: 'DEVELOPING',    xp: 450, streakDays: 7,  badges: 3, lastActive: daysAgo(0),  createdAt: daysAgo(30) },
  { id: 's2', firstName: 'Hana',   lastName: 'Girma',   email: 'hana@lisan.com',   grade: 'GRADE_7', teacherId: 't1', parentId: 'p2', score: 58, status: 'NEEDS_SUPPORT',  xp: 290, streakDays: 3,  badges: 0, lastActive: daysAgo(1),  createdAt: daysAgo(25) },
  { id: 's3', firstName: 'Abel',   lastName: 'Haile',   email: 'abel@lisan.com',   grade: 'GRADE_5', teacherId: 't1',               score: 45, status: 'NEEDS_SUPPORT',  xp: 120, streakDays: 0,  badges: 0, lastActive: daysAgo(3),  createdAt: daysAgo(20) },
  { id: 's4', firstName: 'Dawit',  lastName: 'Bekele',  email: 'dawit@lisan.com',  grade: 'GRADE_6', teacherId: 't1', parentId: 'p4', score: 84, status: 'READY',          xp: 780, streakDays: 14, badges: 4, lastActive: daysAgo(0),  createdAt: daysAgo(60) },
  { id: 's5', firstName: 'Meron',  lastName: 'Alemu',   email: 'meron@lisan.com',  grade: 'GRADE_7', teacherId: 't2',               score: 78, status: 'READY',          xp: 560, streakDays: 5,  badges: 2, lastActive: daysAgo(2),  createdAt: daysAgo(45) },
  { id: 's6', firstName: 'Biruk',  lastName: 'Tadesse', email: 'biruk@lisan.com',  grade: 'GRADE_5', teacherId: 't2',               score: 65, status: 'DEVELOPING',    xp: 310, streakDays: 2,  badges: 1, lastActive: daysAgo(1),  createdAt: daysAgo(15) },
  { id: 's7', firstName: 'Liya',   lastName: 'Solomon', email: 'liya@lisan.com',   grade: 'GRADE_6', teacherId: 't1', parentId: 'p5', score: 55, status: 'NEEDS_SUPPORT',  xp: 90,  streakDays: 0,  badges: 0, lastActive: daysAgo(4),  createdAt: daysAgo(10) },
  { id: 's8', firstName: 'Naomi',  lastName: 'Bekele',  email: 'naomi@lisan.com',  grade: 'GRADE_7', teacherId: 't2', parentId: 'p4', score: 88, status: 'READY',          xp: 920, streakDays: 21, badges: 5, lastActive: daysAgo(0),  createdAt: daysAgo(90) },
  { id: 's9', firstName: 'Yared',  lastName: 'Haile',   email: 'yared@lisan.com',  grade: 'GRADE_8', teacherId: 't3',               score: 71, status: 'DEVELOPING',    xp: 430, streakDays: 4,  badges: 2, lastActive: daysAgo(2),  createdAt: daysAgo(35) },
  { id: 's10',firstName: 'Helen',  lastName: 'Girma',   email: 'helen@lisan.com',  grade: 'GRADE_8', teacherId: 't3',               score: 79, status: 'READY',          xp: 610, streakDays: 9,  badges: 3, lastActive: daysAgo(1),  createdAt: daysAgo(55) },
]

let parents: AdminParent[] = [
  { id: 'p1', firstName: 'Almaz',    lastName: 'Tadesse',  email: 'parent1@lisan.com',  childrenIds: ['s1'],      active: true,  joinedAt: daysAgo(60) },
  { id: 'p2', firstName: 'Solomon',  lastName: 'Girma',    email: 'parent2@lisan.com',  childrenIds: ['s2'],      active: true,  joinedAt: daysAgo(45) },
  { id: 'p3', firstName: 'Kebede',   lastName: 'Haile',    email: 'parent3@lisan.com',  childrenIds: ['s3'],      active: false, joinedAt: daysAgo(30) },
  { id: 'p4', firstName: 'Tigist',   lastName: 'Bekele',   email: 'parent4@lisan.com',  childrenIds: ['s4','s8'], active: true,  joinedAt: daysAgo(90) },
  { id: 'p5', firstName: 'Mulunesh', lastName: 'Solomon',  email: 'parent5@lisan.com',  childrenIds: ['s7'],      active: true,  joinedAt: daysAgo(15) },
]

let teachers: AdminTeacher[] = [
  { id: 't1', firstName: 'Tigist',    lastName: 'Bekele',  email: 'teacher@lisan.com', grades: 'Grade 5–7', studentIds: ['s1','s2','s3','s4','s7'], active: true,  joinedAt: daysAgo(120) },
  { id: 't2', firstName: 'Yonas',     lastName: 'Girma',   email: 'yonas@lisan.com',   grades: 'Grade 5–7', studentIds: ['s5','s6','s8'],           active: true,  joinedAt: daysAgo(90) },
  { id: 't3', firstName: 'Selamawit', lastName: 'Worku',   email: 'selam@lisan.com',   grades: 'Grade 8',   studentIds: ['s9','s10'],               active: true,  joinedAt: daysAgo(60) },
  { id: 't4', firstName: 'Berhane',   lastName: 'Tesfaye', email: 'berhane@lisan.com', grades: '—',         studentIds: [],                         active: false, joinedAt: daysAgo(7) },
]

let admins: AdminAdmin[] = [
  { id: 'a1', firstName: 'Admin',   lastName: 'Lisan',   email: 'admin@lisan.com',   role: 'SUPER_ADMIN',   active: true, joinedAt: daysAgo(180) },
  { id: 'a2', firstName: 'Content', lastName: 'Manager', email: 'content@lisan.com', role: 'CONTENT_ADMIN', active: true, joinedAt: daysAgo(60) },
]

let passages: AdminPassage[] = [
  { id: 'ps1', title: 'The Ethiopian Highlands', grade: 'GRADE_6', difficulty: 'MEDIUM', topic: 'Geography', wordCount: 112, language: 'en', createdAt: daysAgo(30), content: 'Ethiopia is home to some of the most dramatic landscapes in Africa. The Ethiopian Highlands stretch across much of the country...' },
  { id: 'ps2', title: 'The Great Rift Valley',   grade: 'GRADE_7', difficulty: 'MEDIUM', topic: 'Science',   wordCount: 118, language: 'en', createdAt: daysAgo(25), content: 'The Great Rift Valley is one of the most fascinating geological features on Earth...' },
  { id: 'ps3', title: 'The Market Morning',      grade: 'GRADE_5', difficulty: 'EASY',   topic: 'Culture',   wordCount: 101, language: 'en', createdAt: daysAgo(20), content: 'Every Saturday, Amara walked with her grandmother to the local market...' },
  { id: 'ps4', title: 'Water and Life',          grade: 'GRADE_6', difficulty: 'MEDIUM', topic: 'Social',    wordCount: 118, language: 'en', createdAt: daysAgo(15), content: 'In many parts of rural Ethiopia, finding clean water is a daily challenge...' },
]

let questions: AdminQuestion[] = [
  { id: 'q1', skillArea: 'VOCABULARY',          subskill: 'context_clues', questionText: 'What does "observed" mean in this sentence?',  questionType: 'multiple_choice', options: ['chased','watched carefully','painted','captured'], correctAnswer: 'watched carefully', explanation: 'Context clues show the scientist is watching carefully.', grade: 'GRADE_6', difficulty: 'MEDIUM', createdAt: daysAgo(30) },
  { id: 'q2', skillArea: 'COMPREHENSION',        subskill: 'main_idea',     questionText: 'What is the main idea of the passage?',          questionType: 'multiple_choice', options: ['Ethiopia has rivers','Highlands shape geography','Farmers grow teff','Coffee is exported'], correctAnswer: 'Highlands shape geography', explanation: 'The passage covers all aspects of the highlands.', grade: 'GRADE_6', difficulty: 'MEDIUM', passageId: 'ps1', createdAt: daysAgo(25) },
  { id: 'q3', skillArea: 'PHONEMIC_AWARENESS',   subskill: 'rhyming',       questionText: 'Which word rhymes with "light"?',                questionType: 'multiple_choice', options: ['lift','night','line','list'], correctAnswer: 'night', explanation: '"Light" and "night" share the "-ight" sound.', grade: 'GRADE_5', difficulty: 'EASY', createdAt: daysAgo(20) },
  { id: 'q4', skillArea: 'PHONICS_DECODING',     subskill: 'silent_e',      questionText: 'What does the silent "e" do in "kite"?',          questionType: 'multiple_choice', options: ['Makes k sound','Makes i long','Changes t','Makes plural'], correctAnswer: 'Makes i long', explanation: 'Silent e makes the vowel before it long.', grade: 'GRADE_5', difficulty: 'MEDIUM', createdAt: daysAgo(15) },
  { id: 'q5', skillArea: 'FLUENCY',              subskill: 'expression',    questionText: 'What should you do at a period (.)?',             questionType: 'multiple_choice', options: ['Speed up','Pause briefly','Raise voice','Skip'], correctAnswer: 'Pause briefly', explanation: 'A period signals the end of a sentence — pause briefly.', grade: 'GRADE_4', difficulty: 'EASY', createdAt: daysAgo(10) },
]

let vocabulary: AdminVocabulary[] = [
  { id: 'v1', word: 'observe',    definition: 'To watch carefully and pay attention to details', exampleSentence: 'The scientist observed the experiment closely.', grade: 'GRADE_5', difficulty: 'MEDIUM', partOfSpeech: 'verb',      synonyms: 'watch, study', antonyms: 'ignore',    amharicTranslation: 'ተፈተለ', createdAt: daysAgo(30) },
  { id: 'v2', word: 'cultivate',  definition: 'To prepare land for crops; to develop something',  exampleSentence: 'Farmers cultivated the rich highland soil.',    grade: 'GRADE_6', difficulty: 'MEDIUM', partOfSpeech: 'verb',      synonyms: 'grow, farm',  antonyms: 'neglect',   amharicTranslation: 'አረሰ',   createdAt: daysAgo(25) },
  { id: 'v3', word: 'evidence',   definition: 'Facts or signs that show something is true',       exampleSentence: 'Scientists found evidence of ancient water.',   grade: 'GRADE_6', difficulty: 'MEDIUM', partOfSpeech: 'noun',      synonyms: 'proof, sign', antonyms: 'disproof',  amharicTranslation: 'ማስረጃ', createdAt: daysAgo(20) },
  { id: 'v4', word: 'foundation', definition: 'The base or most important supporting part',       exampleSentence: 'Education is the foundation of success.',      grade: 'GRADE_6', difficulty: 'MEDIUM', partOfSpeech: 'noun',      synonyms: 'base, basis', antonyms: 'top',       amharicTranslation: 'መሠረት', createdAt: daysAgo(15) },
  { id: 'v5', word: 'dramatic',   definition: 'Very noticeable or impressive',                    exampleSentence: 'The mountain view was dramatic.',              grade: 'GRADE_6', difficulty: 'MEDIUM', partOfSpeech: 'adjective', synonyms: 'striking',    antonyms: 'ordinary',  amharicTranslation: '',      createdAt: daysAgo(10) },
]

let lessons: AdminLesson[] = [
  { id: 'l1', skillArea: 'VOCABULARY',    subskill: 'context_clues',   title: 'Using Context Clues',           grade: 'GRADE_6', difficulty: 'MEDIUM', explanation: 'When you see an unfamiliar word, look at surrounding words for clues about its meaning.', tips: 'Look for defining phrases, examples, or contrast words near the unfamiliar word.', order: 1, createdAt: daysAgo(30) },
  { id: 'l2', skillArea: 'COMPREHENSION', subskill: 'main_idea',       title: 'Finding the Main Idea',         grade: 'GRADE_6', difficulty: 'MEDIUM', explanation: 'The main idea is the most important point the author wants you to understand.',            tips: 'Ask: "What is this mostly about?" The main idea covers the whole passage, not just one detail.', order: 1, createdAt: daysAgo(25) },
  { id: 'l3', skillArea: 'FLUENCY',       subskill: 'repeated_reading', title: 'Repeated Reading for Fluency', grade: 'GRADE_6', difficulty: 'MEDIUM', explanation: 'Read the same passage multiple times to build speed, accuracy, and expression.',            tips: 'First read for accuracy. Second for smoothness. Third for expression.',                         order: 1, createdAt: daysAgo(20) },
]

// ─── Unique ID generator ──────────────────────────────────────────────────────
function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentStore = {
  getAll: () => [...students],
  getById: (id: string) => students.find(s => s.id === id),
  create: (data: Omit<AdminStudent, 'id' | 'createdAt' | 'xp' | 'streakDays' | 'badges' | 'score' | 'status' | 'lastActive'>) => {
    const item: AdminStudent = {
      ...data, id: uid('s'), createdAt: now(),
      xp: 0, streakDays: 0, badges: 0, score: 0,
      status: 'NOT_ASSESSED', lastActive: now(),
    }
    students = [item, ...students]
    return item
  },
  update: (id: string, data: Partial<AdminStudent>) => {
    students = students.map(s => s.id === id ? { ...s, ...data } : s)
    return students.find(s => s.id === id)!
  },
  delete: (id: string) => { students = students.filter(s => s.id !== id) },
}

// ─── Parents ──────────────────────────────────────────────────────────────────
export const parentStore = {
  getAll: () => [...parents],
  getById: (id: string) => parents.find(p => p.id === id),
  create: (data: Omit<AdminParent, 'id' | 'joinedAt'>) => {
    const item: AdminParent = { ...data, id: uid('p'), joinedAt: now() }
    parents = [item, ...parents]
    return item
  },
  update: (id: string, data: Partial<AdminParent>) => {
    parents = parents.map(p => p.id === id ? { ...p, ...data } : p)
    return parents.find(p => p.id === id)!
  },
  delete: (id: string) => { parents = parents.filter(p => p.id !== id) },
}

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teacherStore = {
  getAll: () => [...teachers],
  getById: (id: string) => teachers.find(t => t.id === id),
  create: (data: Omit<AdminTeacher, 'id' | 'joinedAt'>) => {
    const item: AdminTeacher = { ...data, id: uid('t'), joinedAt: now() }
    teachers = [item, ...teachers]
    return item
  },
  update: (id: string, data: Partial<AdminTeacher>) => {
    teachers = teachers.map(t => t.id === id ? { ...t, ...data } : t)
    return teachers.find(t => t.id === id)!
  },
  delete: (id: string) => { teachers = teachers.filter(t => t.id !== id) },
}

// ─── Admins ───────────────────────────────────────────────────────────────────
export const adminUserStore = {
  getAll: () => [...admins],
  create: (data: Omit<AdminAdmin, 'id' | 'joinedAt'>) => {
    const item: AdminAdmin = { ...data, id: uid('a'), joinedAt: now() }
    admins = [item, ...admins]
    return item
  },
  update: (id: string, data: Partial<AdminAdmin>) => {
    admins = admins.map(a => a.id === id ? { ...a, ...data } : a)
    return admins.find(a => a.id === id)!
  },
  delete: (id: string) => { admins = admins.filter(a => a.id !== id) },
}

// ─── Passages ─────────────────────────────────────────────────────────────────
export const passageStore = {
  getAll: () => [...passages],
  create: (data: Omit<AdminPassage, 'id' | 'createdAt'>) => {
    const item: AdminPassage = { ...data, id: uid('ps'), createdAt: now() }
    passages = [item, ...passages]
    return item
  },
  update: (id: string, data: Partial<AdminPassage>) => {
    passages = passages.map(p => p.id === id ? { ...p, ...data } : p)
    return passages.find(p => p.id === id)!
  },
  delete: (id: string) => { passages = passages.filter(p => p.id !== id) },
}

// ─── Questions ────────────────────────────────────────────────────────────────
export const questionStore = {
  getAll: () => [...questions],
  create: (data: Omit<AdminQuestion, 'id' | 'createdAt'>) => {
    const item: AdminQuestion = { ...data, id: uid('q'), createdAt: now() }
    questions = [item, ...questions]
    return item
  },
  update: (id: string, data: Partial<AdminQuestion>) => {
    questions = questions.map(q => q.id === id ? { ...q, ...data } : q)
    return questions.find(q => q.id === id)!
  },
  delete: (id: string) => { questions = questions.filter(q => q.id !== id) },
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────
export const vocabularyStore = {
  getAll: () => [...vocabulary],
  create: (data: Omit<AdminVocabulary, 'id' | 'createdAt'>) => {
    const item: AdminVocabulary = { ...data, id: uid('v'), createdAt: now() }
    vocabulary = [item, ...vocabulary]
    return item
  },
  update: (id: string, data: Partial<AdminVocabulary>) => {
    vocabulary = vocabulary.map(v => v.id === id ? { ...v, ...data } : v)
    return vocabulary.find(v => v.id === id)!
  },
  delete: (id: string) => { vocabulary = vocabulary.filter(v => v.id !== id) },
}

// ─── Lessons ──────────────────────────────────────────────────────────────────
export const lessonStore = {
  getAll: () => [...lessons],
  create: (data: Omit<AdminLesson, 'id' | 'createdAt'>) => {
    const item: AdminLesson = { ...data, id: uid('l'), createdAt: now() }
    lessons = [item, ...lessons]
    return item
  },
  update: (id: string, data: Partial<AdminLesson>) => {
    lessons = lessons.map(l => l.id === id ? { ...l, ...data } : l)
    return lessons.find(l => l.id === id)!
  },
  delete: (id: string) => { lessons = lessons.filter(l => l.id !== id) },
}
