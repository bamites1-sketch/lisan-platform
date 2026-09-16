import React, { createContext, useContext, useState, useCallback } from 'react'

export type Lang = 'en' | 'am'

// ─── All UI strings ────────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    appName: 'Lisan | ልሳን',
    tagline: 'Discover how you read. Learn what you need. Watch yourself grow.',
    // Nav
    home: 'Home', assessment: 'Assessment', myProfile: 'My Profile',
    myPlan: 'My Plan', practice: 'Practice', progress: 'Progress', signOut: 'Sign Out',
    // Auth
    signIn: 'Sign In', createAccount: 'Create Account', welcomeBack: 'Welcome back 👋',
    continueJourney: 'Sign in to continue your reading journey',
    emailAddress: 'Email address', password: 'Password', confirmPassword: 'Confirm password',
    firstName: 'First name', lastName: 'Last name', grade: 'Grade',
    iAmA: 'I am a…', student: 'Student', parent: 'Parent', teacher: 'Teacher', admin: 'Admin',
    alreadyHaveAccount: 'Already have an account?', noAccount: "Don't have an account?",
    // Dashboard
    greeting: 'Hi',
    streakMsg: (n: number) => `You're on a ${n}-day streak! Keep it going 🔥`,
    welcomeMsg: "Welcome to Lisan! Let's discover how you read.",
    readinessScore: 'Readiness Score', targetGrade: 'Reading Readiness',
    yourSkills: 'Your Reading Skills', quickPractice: 'Quick Practice', badges: 'Badges',
    startAssessment: 'Start Assessment', continueLearning: 'Continue Learning →',
    viewProfile: 'View Full Profile', retakeAssessment: 'Retake Assessment',
    // Assessment
    assessmentTitle: 'Your Reading Assessment',
    assessmentIntro: "This isn't a test you can fail. We just want to discover how you read so we can help you improve.",
    letsBegin: "Let's Begin →", maybeLater: 'Maybe Later',
    checkAnswer: 'Check Answer', nextQuestion: 'Next Question →', seeResults: 'See Results 🎉',
    needHint: 'Need a hint?', correct: '✅ Correct!', incorrect: '❌ Not quite',
    assessmentComplete: 'Assessment Complete!',
    // Voice
    speakAnswer: 'Speak your answer',
    recording: 'Recording… click to stop',
    recordingTip: 'Say your answer clearly, then tap the mic again to stop.',
    orType: 'or type below',
    // Plan
    yourPlan: '6-Week Reading Plan', currentWeek: 'Current', complete: 'Complete',
    // Progress
    progressTitle: 'Your Progress', firstScore: 'First Score', latestScore: 'Latest Score',
    totalImprovement: 'Total Improvement', daysActive: 'Days Active',
    currentStreak: 'Current Streak', activitiesDone: 'Activities Done', xpEarned: 'XP Earned',
    // Roles page
    adminDashboard: 'Admin Dashboard', studentsTab: 'Students', parentsTab: 'Parents',
    teachersTab: 'Teachers', adminsTab: 'Admins', overview: 'Overview',
    // Language
    language: 'Language', english: 'English', amharic: 'አማርኛ',
  },
  am: {
    appName: 'ልሳን',
    tagline: 'እንዴት እንደምታነብ ፈልግ። ምን እንደሚያስፈልግህ ተማር። ዕድገትህን ተመልከት።',
    // Nav
    home: 'መነሻ', assessment: 'ምዘና', myProfile: 'መገለጫዬ',
    myPlan: 'ፕላኔ', practice: 'ልምምድ', progress: 'እድገት', signOut: 'ውጣ',
    // Auth
    signIn: 'ግባ', createAccount: 'መለያ ፍጠር', welcomeBack: 'እንኳን ደህና ተመለሱ 👋',
    continueJourney: 'ወደ ንባብ ጉዞዎ ለመቀጠል ይግቡ',
    emailAddress: 'ኢሜይል', password: 'የይለፍ ቃል', confirmPassword: 'የይለፍ ቃል ያረጋግጡ',
    firstName: 'ስም', lastName: 'የአባት ስም', grade: 'ክፍል',
    iAmA: 'እኔ ነኝ…', student: 'ተማሪ', parent: 'ወላጅ', teacher: 'አስተማሪ', admin: 'አስተዳዳሪ',
    alreadyHaveAccount: 'መለያ አለዎት?', noAccount: 'መለያ የለዎትም?',
    // Dashboard
    greeting: 'ሰላም',
    streakMsg: (n: number) => `${n} ቀን ተከታታይ! ቀጥሉ 🔥`,
    welcomeMsg: 'ወደ ልሳን እንኳን ደህና መጡ!',
    readinessScore: 'የዝግጁነት ነጥብ', targetGrade: 'የንባብ ዝግጁነት',
    yourSkills: 'የንባብ ክህሎቶችዎ', quickPractice: 'ፈጣን ልምምድ', badges: 'ሽልማቶች',
    startAssessment: 'ምዘናን ጀምር', continueLearning: 'መማሩን ቀጥል →',
    viewProfile: 'ሙሉ መገለጫ ይመልከቱ', retakeAssessment: 'ምዘናን እንደገና ውሰድ',
    // Assessment
    assessmentTitle: 'የንባብ ምዘናዎ',
    assessmentIntro: 'ይህ ሊያሳዝናዎ የሚችል ፈተና አይደለም። እንዴት እንደሚያነቡ ለማወቅ ብቻ ነው።',
    letsBegin: 'እንጀምር →', maybeLater: 'ቆይቶ',
    checkAnswer: 'መልስ ፈትሽ', nextQuestion: 'ቀጣይ ጥያቄ →', seeResults: 'ውጤቶችን ይመልከቱ 🎉',
    needHint: 'ፍንጭ ያስፈልጋል?', correct: '✅ ትክክል!', incorrect: '❌ ትክክል አይደለም',
    assessmentComplete: 'ምዘናው ተጠናቋል!',
    // Voice
    speakAnswer: 'መልስዎን ይናገሩ',
    recording: 'በመቅዳት ላይ… ለማቆም ዳግም ይጫኑ',
    recordingTip: 'መልስዎን በግልጽ ይናገሩ ከዚያም ማይክሮፎኑን ዳግም ይጫኑ።',
    orType: 'ወይም ከዚህ በታች ይጻፉ',
    // Plan
    yourPlan: '6-ሳምንት የንባብ ፕላን', currentWeek: 'አሁን', complete: 'ተጠናቋል',
    // Progress
    progressTitle: 'እድገትዎ', firstScore: 'የመጀመሪያ ነጥብ', latestScore: 'የቅርብ ጊዜ ነጥብ',
    totalImprovement: 'ጠቅላላ ዕድገት', daysActive: 'ንቁ ቀናት',
    currentStreak: 'ተከታታይ ቀናት', activitiesDone: 'የተጠናቀቁ', xpEarned: 'XP ተሸልሟል',
    // Roles page
    adminDashboard: 'የአስተዳዳሪ ዳሽቦርድ', studentsTab: 'ተማሪዎች', parentsTab: 'ወላጆች',
    teachersTab: 'አስተማሪዎች', adminsTab: 'አስተዳዳሪዎች', overview: 'አጠቃላይ እይታ',
    // Language
    language: 'ቋንቋ', english: 'English', amharic: 'አማርኛ',
  },
} as const

type StringsType = typeof STRINGS.en
type LangContextType = { lang: Lang; t: StringsType; setLang: (l: Lang) => void }

const LangContext = createContext<LangContextType>({
  lang: 'en', t: STRINGS.en,
  setLang: () => {},
})

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('lisan_lang') as Lang) || 'en'
  )

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem('lisan_lang', l)
  }, [])

  return (
    <LangContext.Provider value={{ lang, t: STRINGS[lang] as StringsType, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
