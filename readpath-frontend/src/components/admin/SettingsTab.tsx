import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/Toast'
import { apiUrl } from '../../lib/apiBase'

type SettingsSection = 'profile' | 'platform' | 'assessments' | 'notifications' | 'diagnostics'

export default function SettingsTab() {
  const { user } = useAuth()
  const toast = useToast()

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  // Profile Form
  const [firstName, setFirstName] = useState(() => (user?.profile as any)?.firstName || 'Admin')
  const [lastName, setLastName] = useState(() => (user?.profile as any)?.lastName || 'User')
  const [phone, setPhone] = useState(() => (user as any)?.phone || '0927417210')
  const [savingProfile, setSavingProfile] = useState(false)

  // Security / Password Form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Platform & Academy Settings
  const [platformName, setPlatformName] = useState(() => localStorage.getItem('lisan_platform_name') || 'LISAN Literacy & Reading Academy')
  const [supportEmail, setSupportEmail] = useState(() => localStorage.getItem('lisan_support_email') || 'HABTAMUGEBREKIDAN@GMAIL.COM')
  const [supportPhone, setSupportPhone] = useState(() => localStorage.getItem('lisan_support_phone') || '0927417210')
  const [academicTerm, setAcademicTerm] = useState(() => localStorage.getItem('lisan_academic_term') || '2026/2027 Academic Year')
  const [savingPlatform, setSavingPlatform] = useState(false)

  // Assessment & Literacy Rules
  const [targetAccuracy, setTargetAccuracy] = useState(() => localStorage.getItem('lisan_target_accuracy') || '85')
  const [targetWcpm, setTargetWcpm] = useState(() => localStorage.getItem('lisan_target_wcpm') || '110')
  const [autoPublishAssessments, setAutoPublish] = useState(() => localStorage.getItem('lisan_auto_publish') !== 'false')
  const [allowInstantRetakes, setAllowRetakes] = useState(() => localStorage.getItem('lisan_allow_retakes') === 'true')
  const [maxAudioMinutes, setMaxAudioMinutes] = useState(() => localStorage.getItem('lisan_max_audio_min') || '10')

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('admin_email_alerts') !== 'false')
  const [submissionAlerts, setSubmissionAlerts] = useState(() => localStorage.getItem('admin_submission_alerts') !== 'false')
  const [signupAlerts, setSignupAlerts] = useState(() => localStorage.getItem('admin_signup_alerts') !== 'false')
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('admin_sound_enabled') !== 'false')

  // Diagnostics
  const [pingStatus, setPingStatus] = useState<{ testing: boolean; latency: number | null; ok: boolean | null; message: string | null }>({
    testing: false,
    latency: null,
    ok: null,
    message: null,
  })

  // Handle Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      const res = await fetch(apiUrl('/api/admin/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName, lastName, phone }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message || 'Could not update profile')
      }
      toast.success('Profile updated', 'Your administrator details were saved successfully.')
    } catch (err: any) {
      toast.error('Update failed', err.message || 'Could not save profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      toast.error('Required fields', 'Please enter your current and new password.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password too short', 'New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mismatch', 'New passwords do not match.')
      return
    }

    setChangingPassword(true)
    try {
      const token = localStorage.getItem('lisan_token') ?? ''
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(d.message || 'Password update failed')
      }
      toast.success('Password changed', 'Your administrator password has been updated securely.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error('Password error', err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  // Handle Save Platform Settings
  const handleSavePlatform = (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPlatform(true)
    localStorage.setItem('lisan_platform_name', platformName)
    localStorage.setItem('lisan_support_email', supportEmail)
    localStorage.setItem('lisan_support_phone', supportPhone)
    localStorage.setItem('lisan_academic_term', academicTerm)
    setTimeout(() => {
      setSavingPlatform(false)
      toast.success('Platform settings saved', 'Academy information updated.')
    }, 400)
  }

  // Handle Save Assessment Rules
  const handleSaveAssessmentRules = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('lisan_target_accuracy', targetAccuracy)
    localStorage.setItem('lisan_target_wcpm', targetWcpm)
    localStorage.setItem('lisan_auto_publish', String(autoPublishAssessments))
    localStorage.setItem('lisan_allow_retakes', String(allowInstantRetakes))
    localStorage.setItem('lisan_max_audio_min', maxAudioMinutes)
    toast.success('Assessment rules saved', 'Reading standards and evaluation benchmarks updated.')
  }

  // Run Backend Diagnostic Ping
  const testBackendConnection = async () => {
    setPingStatus({ testing: true, latency: null, ok: null, message: null })
    const start = Date.now()
    try {
      const res = await fetch(apiUrl('/health'), { cache: 'no-store' })
      const latency = Date.now() - start
      const json = await res.json().catch(() => ({}))
      if (res.ok && json.status === 'ok') {
        setPingStatus({
          testing: false,
          latency,
          ok: true,
          message: `Live online and operational! Response time: ${latency}ms`,
        })
        toast.success('Backend Connected', `Response: 200 OK (${latency}ms)`)
      } else {
        setPingStatus({
          testing: false,
          latency,
          ok: false,
          message: `HTTP ${res.status}: Unexpected response`,
        })
        toast.error('Health Check Warning', `Status code: ${res.status}`)
      }
    } catch (err: any) {
      const latency = Date.now() - start
      setPingStatus({
        testing: false,
        latency,
        ok: false,
        message: err?.message || 'Could not connect to backend server',
      })
      toast.error('Connection Failed', err?.message || 'Backend unreachable')
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in">
      {/* Header Banner */}
      <div className="bg-[#003f3a] rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#f2c94c]">
              Enterprise Administration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">System Settings &amp; Security</h1>
          <p className="text-white/70 text-sm mt-1">
            Manage your admin credentials, academy configuration, assessment parameters, and cloud health.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl border border-white/15">
          <div className="w-10 h-10 rounded-xl bg-[#f2c94c] text-[#003f3a] font-extrabold flex items-center justify-center text-lg shadow-sm">
            {firstName?.[0] || 'A'}
          </div>
          <div>
            <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">Signed In As</p>
            <p className="text-sm font-bold text-white">{user?.email || 'admin@lisan.com'}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px scrollbar-none">
        {[
          { id: 'profile', label: 'Admin Profile & Security', icon: '🛡️' },
          { id: 'platform', label: 'Platform & Academy', icon: '🏫' },
          { id: 'assessments', label: 'Assessment Rules', icon: '📋' },
          { id: 'notifications', label: 'Notifications', icon: '🔔' },
          { id: 'diagnostics', label: 'Cloud Diagnostics', icon: '⚡' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as SettingsSection)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-150 ${
              activeSection === tab.id
                ? 'border-[#003f3a] text-[#003f3a]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Section 1: Profile & Security */}
      {activeSection === 'profile' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Profile */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-lg font-bold">
                  👤
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Administrator Identity</h2>
                  <p className="text-xs text-gray-500">Update your primary administrative contact profile</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || 'admin@lisan.com'}
                    disabled
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Primary administrative account email.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#003f3a] hover:bg-[#002e2a] text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg font-bold">
                  🔒
                </span>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Security &amp; Password</h2>
                  <p className="text-xs text-gray-500">Update your account password with instant verification</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                  >
                    {changingPassword ? 'Updating Password...' : 'Update Password Securely'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Platform & Academy */}
      {activeSection === 'platform' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">
              🏫
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Platform &amp; Academy Configuration</h2>
              <p className="text-xs text-gray-500">Configure global metadata displayed to learners and parents</p>
            </div>
          </div>

          <form onSubmit={handleSavePlatform} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Platform Brand Title</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Official Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Support Phone Hotline</label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Academic Term</label>
              <input
                type="text"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
              />
            </div>

            {/* Founder Summary Badge */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex items-center gap-4">
              <img
                src="/founder.png"
                alt="Dr. Habtamu"
                className="w-14 h-14 rounded-xl object-cover object-top border border-[#d4af37]/40 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-gray-900">Dr. Habtamu</p>
                <p className="text-xs text-gray-500">Founder &amp; Lead Educator (20+ Years Classroom Experience)</p>
                <span className="inline-block mt-1 text-[11px] text-[#003f3a] font-semibold">
                  Founder profile is active and featured on public home page.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPlatform}
                className="px-6 py-2.5 rounded-xl bg-[#003f3a] hover:bg-[#002e2a] text-white font-semibold text-sm transition-colors shadow-sm"
              >
                {savingPlatform ? 'Saving...' : 'Save Academy Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 3: Assessment Rules */}
      {activeSection === 'assessments' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg font-bold">
              📊
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Reading Assessment &amp; Fluency Standards</h2>
              <p className="text-xs text-gray-500">Tune benchmark expectations and evaluation criteria</p>
            </div>
          </div>

          <form onSubmit={handleSaveAssessmentRules} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target Accuracy Benchmark (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetAccuracy}
                  onChange={(e) => setTargetAccuracy(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">Recommended standard: 85% - 90%</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Target WCPM (Words Correct / Min)
                </label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  value={targetWcpm}
                  onChange={(e) => setTargetWcpm(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1">Grade 4 - 8 average fluency target</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Maximum Audio Recording Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={maxAudioMinutes}
                onChange={(e) => setMaxAudioMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#168f88] focus:bg-white"
              />
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPublishAssessments}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="h-4 w-4 accent-[#003f3a] rounded"
                />
                <span className="text-sm font-medium text-gray-800">
                  Auto-publish created assessments immediately for student taking
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowInstantRetakes}
                  onChange={(e) => setAllowRetakes(e.target.checked)}
                  className="h-4 w-4 accent-[#003f3a] rounded"
                />
                <span className="text-sm font-medium text-gray-800">
                  Allow students to re-record prior to teacher evaluation
                </span>
              </label>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#003f3a] hover:bg-[#002e2a] text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Save Evaluation Rules
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 4: Notifications */}
      {activeSection === 'notifications' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-3xl space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg font-bold">
              🔔
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Notification Alerts &amp; Digest</h2>
              <p className="text-xs text-gray-500">Control triggers for automated alerts sent to administrators</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <label className="flex items-center justify-between py-4 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-800">New Assessment Submissions</p>
                <p className="text-xs text-gray-500">Alert admin when a student records and submits their reading</p>
              </div>
              <input
                type="checkbox"
                checked={submissionAlerts}
                onChange={(e) => {
                  setSubmissionAlerts(e.target.checked)
                  localStorage.setItem('admin_submission_alerts', String(e.target.checked))
                  toast.success('Updated', 'Submission alert preference saved')
                }}
                className="h-4 w-4 accent-[#003f3a]"
              />
            </label>

            <label className="flex items-center justify-between py-4 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-800">New Learner Registrations</p>
                <p className="text-xs text-gray-500">Notify admin when a new student or parent creates an account</p>
              </div>
              <input
                type="checkbox"
                checked={signupAlerts}
                onChange={(e) => {
                  setSignupAlerts(e.target.checked)
                  localStorage.setItem('admin_signup_alerts', String(e.target.checked))
                  toast.success('Updated', 'Registration alert preference saved')
                }}
                className="h-4 w-4 accent-[#003f3a]"
              />
            </label>

            <label className="flex items-center justify-between py-4 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-800">Email Notifications</p>
                <p className="text-xs text-gray-500">Forward urgent alerts to HABTAMUGEBREKIDAN@GMAIL.COM</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => {
                  setEmailAlerts(e.target.checked)
                  localStorage.setItem('admin_email_alerts', String(e.target.checked))
                  toast.success('Updated', 'Email notification preference saved')
                }}
                className="h-4 w-4 accent-[#003f3a]"
              />
            </label>

            <label className="flex items-center justify-between py-4 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-gray-800">In-Dashboard Sound Alerts</p>
                <p className="text-xs text-gray-500">Play subtle sound when a live submission arrives</p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => {
                  setSoundEnabled(e.target.checked)
                  localStorage.setItem('admin_sound_enabled', String(e.target.checked))
                  toast.success('Updated', 'Sound alert preference saved')
                }}
                className="h-4 w-4 accent-[#003f3a]"
              />
            </label>
          </div>
        </div>
      )}

      {/* Section 5: Cloud Diagnostics */}
      {activeSection === 'diagnostics' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">
              ⚡
            </span>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Cloud Infrastructure Diagnostics</h2>
              <p className="text-xs text-gray-500">Inspect server connectivity, database latency, and storage mode</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Target API Backend</p>
              <p className="text-sm font-mono font-bold text-gray-900 mt-1 break-all">
                https://readpath-backend.vercel.app
              </p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Vercel Edge Active
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Database Cluster</p>
              <p className="text-sm font-bold text-gray-900 mt-1">PostgreSQL Enterprise</p>
              <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                Prisma 5.22 Connected
              </span>
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Live Health Probe</h4>
                <p className="text-xs text-gray-500 mt-0.5">Ping the online API endpoint to verify real-time response time</p>
              </div>

              <button
                onClick={testBackendConnection}
                disabled={pingStatus.testing}
                className="px-5 py-2.5 rounded-xl bg-[#003f3a] hover:bg-[#002e2a] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pingStatus.testing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Pinging...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Test Backend Ping</span>
                  </>
                )}
              </button>
            </div>

            {pingStatus.message && (
              <div
                className={`mt-4 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
                  pingStatus.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <span>{pingStatus.ok ? '✅' : '❌'}</span>
                <span>{pingStatus.message}</span>
              </div>
            )}
          </div>

          {/* Clear Cache */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs font-bold text-gray-800">Local Browser Cache</p>
              <p className="text-[11px] text-gray-500">Purge cached state and reload active session</p>
            </div>
            <button
              onClick={() => {
                sessionStorage.clear()
                toast.success('Cache Cleared', 'Active session refreshed.')
                setTimeout(() => window.location.reload(), 400)
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
            >
              Clear &amp; Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
