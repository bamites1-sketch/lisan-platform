import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LangProvider } from './contexts/LangContext'

// Build: 2026-09-24 12:17 - FORCE DEPLOYMENT
// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PaymentPage from './pages/PaymentPage'
import StudentDashboard from './pages/student/Dashboard'
import AssessmentPage from './pages/student/AssessmentPage'
import LisanAssessmentPage from './pages/student/LisanAssessmentPage'
import MyAssessmentsPage from './pages/student/MyAssessmentsPage'
import ReadingProfilePage from './pages/student/ReadingProfilePage'
import LearningPlanPage from './pages/student/LearningPlanPage'
import LessonPage from './pages/student/LessonPage'
import PracticePage from './pages/student/PracticePage'
import ProgressPage from './pages/student/ProgressPage'
import ReadingPracticePage from './pages/student/ReadingPracticePage'
import AssignmentsPage from './pages/student/AssignmentsPage'
import ClassesPage from './pages/student/ClassesPage'
import ParentDashboard from './pages/parent/Dashboard'
import NotificationsPage from './pages/NotificationsPage'
import TeacherDashboard from './pages/teacher/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import AssessmentSubmissionsPage from './pages/admin/AssessmentSubmissionsPage'
import CreateAssignmentPage from './components/admin/CreateAssignmentPage'
import DiagnosticPage from './pages/DiagnosticPage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  
  // Redirect students/parents with non-ACTIVE status to payment page
  if ((user.role === 'STUDENT' || user.role === 'PARENT') && user.status !== 'ACTIVE') {
    // Allow access to /payment page itself
    if (window.location.pathname !== '/payment') {
      return <Navigate to="/payment" replace />
    }
  }
  
  return <>{children}</>
}

function RoleRouter() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  switch (user.role) {
    case 'STUDENT': return <Navigate to="/student/dashboard" replace />
    case 'PARENT':  return <Navigate to="/parent/dashboard" replace />
    case 'TEACHER': return <Navigate to="/teacher/dashboard" replace />
    case 'ADMIN':   return <Navigate to="/admin/dashboard" replace />
    default:        return <Navigate to="/login" replace />
  }
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Loading Lisan…</p>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />

          {/* Role redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/assessment" element={<ProtectedRoute roles={['STUDENT']}><AssessmentPage /></ProtectedRoute>} />
          <Route path="/student/assessments" element={<ProtectedRoute roles={['STUDENT']}><MyAssessmentsPage /></ProtectedRoute>} />
          <Route path="/student/assessments/:assessmentId" element={<ProtectedRoute roles={['STUDENT']}><LisanAssessmentPage /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute roles={['STUDENT']}><ReadingProfilePage /></ProtectedRoute>} />
          <Route path="/student/plan" element={<ProtectedRoute roles={['STUDENT']}><LearningPlanPage /></ProtectedRoute>} />
          <Route path="/student/lesson/:id" element={<ProtectedRoute roles={['STUDENT']}><LessonPage /></ProtectedRoute>} />
          <Route path="/student/practice/:skill" element={<ProtectedRoute roles={['STUDENT']}><PracticePage /></ProtectedRoute>} />
          <Route path="/student/progress" element={<ProtectedRoute roles={['STUDENT']}><ProgressPage /></ProtectedRoute>} />
          <Route path="/student/reading-practice" element={<ProtectedRoute roles={['STUDENT']}><ReadingPracticePage /></ProtectedRoute>} />
          <Route path="/student/assignments" element={<ProtectedRoute roles={['STUDENT']}><AssignmentsPage /></ProtectedRoute>} />
          <Route path="/student/classes" element={<ProtectedRoute roles={['STUDENT']}><ClassesPage /></ProtectedRoute>} />

          {/* Parent routes */}
          <Route path="/parent/dashboard" element={<ProtectedRoute roles={['PARENT']}><ParentDashboard /></ProtectedRoute>} />

          {/* Teacher routes */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute roles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/assessment-submissions" element={<ProtectedRoute roles={['ADMIN']}><AssessmentSubmissionsPage /></ProtectedRoute>} />
          <Route path="/admin/assignments/create" element={<ProtectedRoute roles={['ADMIN']}><CreateAssignmentPage /></ProtectedRoute>} />

          {/* Notifications — all roles */}
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* Diagnostic page - temporary */}
          <Route path="/diagnostic" element={<DiagnosticPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LangProvider>
  )
}
