import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parentFeedbackApi } from '../../services/feedbackCommunicationApi';
import { parentApi, type ApiChildDetail } from '../../services/api';
import type { ParentFeedback, ParentProfile } from '../../types';

export default function ParentFeedbackPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const profile = user?.profile as ParentProfile | undefined;

  const [children, setChildren] = useState<ApiChildDetail[]>([]);
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'RESPONDED'>('ALL');

  // Form state
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [category, setCategory] = useState<'PROGRESS' | 'CONCERN' | 'SUGGESTION' | 'GENERAL'>('PROGRESS');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [areasOfConcern, setAreasOfConcern] = useState('');
  const [suggestions, setSuggestions] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [childrenData, feedbacksData] = await Promise.all([
        parentApi.children().catch(() => []),
        parentFeedbackApi.getMyFeedbacks().catch(() => [])
      ]);

      setChildren(childrenData || []);
      if (childrenData && childrenData.length > 0 && !selectedStudentId) {
        setSelectedStudentId(childrenData[0].id);
      }
      setFeedbacks(feedbacksData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load feedback records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressNotes.trim() && !areasOfConcern.trim() && !suggestions.trim()) {
      setError('Please fill in at least one feedback section (Progress, Concerns, or Suggestions).');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await parentFeedbackApi.submit({
        studentId: selectedStudentId || undefined,
        category,
        rating,
        title: title.trim() || undefined,
        progressNotes: progressNotes.trim() || undefined,
        areasOfConcern: areasOfConcern.trim() || undefined,
        suggestions: suggestions.trim() || undefined
      });

      setSuccessMsg('Your feedback has been submitted successfully to the administration!');
      // Reset text inputs but keep student/category
      setTitle('');
      setProgressNotes('');
      setAreasOfConcern('');
      setSuggestions('');

      // Reload feedbacks list
      const updated = await parentFeedbackApi.getMyFeedbacks();
      setFeedbacks(updated || []);

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filterStatus === 'PENDING') return f.status === 'PENDING';
    if (filterStatus === 'RESPONDED') return f.status === 'REVIEWED' || f.status === 'RESOLVED' || !!f.adminResponse;
    return true;
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">📈 Progress</span>;
      case 'CONCERN':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">⚠️ Concern</span>;
      case 'SUGGESTION':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">💡 Suggestion</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">💬 General</span>;
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: 'Needs Significant Improvement',
    2: 'Below Expectations',
    3: 'Satisfactory / Average',
    4: 'Very Good Progress',
    5: 'Excellent Experience'
  };

  const pendingCount = feedbacks.filter(f => f.status === 'PENDING').length;
  const respondedCount = feedbacks.filter(f => f.status === 'REVIEWED' || f.status === 'RESOLVED' || !!f.adminResponse).length;

  return (
    <div className="min-h-screen bg-[#f8faf9] flex flex-col antialiased text-gray-900">
      {/* ── TOP HEADER ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-xs pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/parent/dashboard" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center p-0.5 shadow-xs border border-gray-200 group-hover:scale-105 transition-transform flex-shrink-0">
                <img src="/icon-192.png" alt="LiSAN Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-gray-900 tracking-wide text-base block leading-tight">LiSAN</span>
                <span className="text-[10px] text-[#2d6a4f] font-bold uppercase tracking-wider block">Parent Portal</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Navigation Tabs */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <Link
                to="/parent/dashboard"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                👨‍👩‍👧 My Children
              </Link>
              <Link
                to="/parent/feedback"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#1a3a2a] shadow-xs transition-colors"
              >
                💬 Feedback & Concerns
              </Link>
            </div>

            <span className="text-xs font-semibold text-gray-600 hidden md:block">
              {profile?.firstName ? `Hi, ${profile.firstName}` : 'Parent'}
            </span>

            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-xs text-gray-500 hover:text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6 flex-1 w-full">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#1a3a2a] via-[#234e38] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold tracking-wide backdrop-blur-xs">
                <span>🤝</span> One-Page Parent Feedback & Inquiries Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Parent Feedback & Communication
              </h1>
              <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
                Direct channel with Lisan administrators and reading specialists. Submit updates about your child's progress, report problems or concerns, share recommendations, and track official admin replies.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 bg-black/25 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex-shrink-0">
              <div className="text-center px-2">
                <span className="text-xl font-black text-white block">{feedbacks.length}</span>
                <span className="text-[10px] text-emerald-200 font-semibold uppercase">Total Sent</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-2">
                <span className="text-xl font-black text-amber-300 block">{pendingCount}</span>
                <span className="text-[10px] text-amber-200 font-semibold uppercase">Pending</span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div className="text-center px-2">
                <span className="text-xl font-black text-emerald-400 block">{respondedCount}</span>
                <span className="text-[10px] text-emerald-200 font-semibold uppercase">Responded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
            <span className="text-lg flex-shrink-0">✅</span>
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* ── TWO-COLUMN ONE-PAGE RESPONSIVE WORKSPACE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ════ COLUMN 1: LIVE FEEDBACK COMPOSER FORM (5 COLS) ════ */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 shadow-card p-5 sm:p-6 lg:p-7 space-y-5 lg:sticky lg:top-24">
            <div className="border-b border-gray-100 pb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#2d6a4f] text-[11px] font-bold mb-1">
                <span>✍️</span> Submit New Feedback
              </div>
              <h2 className="text-lg font-extrabold text-[#1a3a2a]">
                Share Observation or Concern
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Our academic administration reviews and acts on every parent inquiry.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Selector */}
              {children.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Select Child *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={e => setSelectedStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:bg-white transition-all cursor-pointer"
                  >
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName} (Grade {child.grade.replace('GRADE_', '')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Star Rating */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Overall Experience Rating
                  </label>
                  <span className="text-[11px] font-bold text-[#2d6a4f]">
                    {ratingDescriptions[hoverRating || rating]}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      {star <= (hoverRating || rating) ? (
                        <span className="text-amber-400">★</span>
                      ) : (
                        <span className="text-gray-300">☆</span>
                      )}
                    </button>
                  ))}
                  <span className="text-xs font-black text-gray-700 ml-2">
                    {hoverRating || rating}/5
                  </span>
                </div>
              </div>

              {/* Primary Category Pills */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Feedback Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'PROGRESS', label: '📈 Student Progress' },
                    { id: 'CONCERN', label: '⚠️ Problem / Concern' },
                    { id: 'SUGGESTION', label: '💡 Future Suggestion' },
                    { id: 'GENERAL', label: '💬 General Experience' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                        category === cat.id
                          ? 'bg-[#1a3a2a] text-[#d4a017] border-[#1a3a2a] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic / Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Brief Summary / Subject
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Great progress with fluency, question about phonics"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:bg-white transition-all"
                />
              </div>

              {/* 1. Student Progress Notes */}
              <div>
                <label className="block text-xs font-bold text-[#2d6a4f] uppercase tracking-wider mb-1">
                  1. Student Progress & Experience
                </label>
                <textarea
                  rows={2}
                  value={progressNotes}
                  onChange={e => setProgressNotes(e.target.value)}
                  placeholder="Share recent improvements, reading confidence, vocabulary growth, or general habits at home..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:bg-white transition-all"
                />
              </div>

              {/* 2. Areas of Concern */}
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                  2. Areas of Concern or Problems Encountered
                </label>
                <textarea
                  rows={2}
                  value={areasOfConcern}
                  onChange={e => setAreasOfConcern(e.target.value)}
                  placeholder="Describe words, syllables, pronunciation, attention, or app difficulties your child faces..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>

              {/* 3. Future Suggestions */}
              <div>
                <label className="block text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
                  3. Future Suggestions & Recommendations
                </label>
                <textarea
                  rows={2}
                  value={suggestions}
                  onChange={e => setSuggestions(e.target.value)}
                  placeholder="What topics, features, or tailored exercises would you love our teachers to introduce?"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#1a3a2a] via-[#234e38] to-[#2d6a4f] hover:brightness-110 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting to Admin...</span>
                  </>
                ) : (
                  <>
                    <span>📨</span>
                    <span>Submit Feedback to Administration</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ════ COLUMN 2: SUBMITTED FEEDBACK & ADMIN REPLIES STREAM (7 COLS) ════ */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Tabs Header */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'ALL'
                      ? 'bg-white text-[#1a3a2a] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({feedbacks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('PENDING')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'PENDING'
                      ? 'bg-amber-100 text-amber-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('RESPONDED')}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterStatus === 'RESPONDED'
                      ? 'bg-emerald-100 text-emerald-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin Responded ({respondedCount})
                </button>
              </div>

              <button
                type="button"
                onClick={loadData}
                className="text-xs font-semibold text-gray-500 hover:text-[#2d6a4f] flex items-center gap-1 ml-auto cursor-pointer"
              >
                <span>↻</span> Refresh
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-gray-100 shadow-xs">
                <div className="w-8 h-8 border-3 border-emerald-200 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Loading your feedback history...</p>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-200/80 shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#2d6a4f] flex items-center justify-center text-2xl mx-auto">
                  💬
                </div>
                <h3 className="font-bold text-gray-800 text-base">No Feedback Submissions Found</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                  {filterStatus === 'ALL'
                    ? 'Use the feedback form on the left to submit your first observations, questions, or concerns.'
                    : `No items matching status filter "${filterStatus}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map(item => {
                  const hasResponse = !!item.adminResponse;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6 space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {getCategoryBadge(item.category)}
                            {item.student && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                👶 {item.student.firstName} {item.student.lastName}
                              </span>
                            )}
                            {item.rating && (
                              <span className="text-amber-400 text-xs font-bold">
                                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                              </span>
                            )}
                          </div>
                          {item.title && (
                            <h3 className="font-extrabold text-sm text-[#1a3a2a]">
                              {item.title}
                            </h3>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              hasResponse
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {hasResponse ? '✓ Admin Responded' : '⏳ In Review'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Parent Submissions Body */}
                      <div className="space-y-2 text-xs">
                        {item.progressNotes && (
                          <div className="p-3 rounded-2xl bg-[#e8f4f0]/40 border border-[#2d6a4f]/15 space-y-0.5">
                            <span className="font-bold text-[#2d6a4f] block">
                              📈 Progress Observations:
                            </span>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {item.progressNotes}
                            </p>
                          </div>
                        )}

                        {item.areasOfConcern && (
                          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-200/40 space-y-0.5">
                            <span className="font-bold text-amber-800 block">
                              ⚠️ Areas of Concern:
                            </span>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {item.areasOfConcern}
                            </p>
                          </div>
                        )}

                        {item.suggestions && (
                          <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-200/40 space-y-0.5">
                            <span className="font-bold text-blue-800 block">
                              💡 Suggestions & Recommendations:
                            </span>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {item.suggestions}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Admin Response Box (Highlighted if present) */}
                      {hasResponse ? (
                        <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#254f3a] text-white space-y-2 shadow-sm border border-[#2d6a4f]/40">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#d4a017] text-[#1a3a2a] flex items-center justify-center font-bold text-xs">
                                🛡️
                              </span>
                              <span className="font-bold text-xs text-[#d4a017]">
                                Official Admin Response
                              </span>
                            </div>
                            {item.respondedAt && (
                              <span className="text-[10px] text-emerald-200/70">
                                {new Date(item.respondedAt).toLocaleDateString()} at{' '}
                                {new Date(item.respondedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-emerald-50 leading-relaxed whitespace-pre-line">
                            {item.adminResponse}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-2 text-gray-500 text-[11px]">
                          <span className="text-amber-500">⏳</span>
                          <span>
                            Awaiting admin review. You will receive an official response and notification shortly.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
