import { useState, useEffect } from 'react';
import StudentLayout from '../../components/layout/StudentLayout';
import { assessmentFeedbackApi } from '../../services/feedbackCommunicationApi';
import type { AssessmentFeedbackItem, AssessmentFeedbackStats } from '../../types';
import { Link } from 'react-router-dom';

export default function AssessmentFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<AssessmentFeedbackItem[]>([]);
  const [stats, setStats] = useState<AssessmentFeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'problems' | 'recommendations'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await assessmentFeedbackApi.getStudentFeedbacks();
      setFeedbacks(res.feedbacks || []);
      setStats(res.stats || null);
    } catch (err) {
      console.error('Failed to load assessment feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f =>
    f.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.feedback.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.problemAreas.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return 'text-gray-500 bg-gray-100 border-gray-200';
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* ── HEADER BANNER ── */}
        <div className="bg-gradient-to-r from-[#1a3a2a] via-[#234e38] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold tracking-wide backdrop-blur-xs">
              <span>📋</span> Official Evaluation Records
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Assessment Feedback & Recommendations
            </h1>
            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Review detailed evaluation feedback from your administrators, understand identified areas of growth, and follow personalized recommendations to excel in your reading journey.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Link
              to="/student/assessments"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition-colors flex items-center gap-1.5"
            >
              <span>←</span> My Assessments
            </Link>
            <Link
              to="/student/chat"
              className="px-4 py-2 rounded-xl bg-[#d4a017] hover:brightness-105 text-[#1a3a2a] font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>💬</span> Chat with Admin
            </Link>
          </div>
        </div>

        {/* ── METRICS SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Evaluations</p>
            <p className="text-2xl sm:text-3xl font-black text-[#1a3a2a] mt-1">
              {stats?.totalAssessments ?? 0}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Reviewed by admin</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-card">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Score</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {stats?.averageScore !== null && stats?.averageScore !== undefined
                ? `${stats.averageScore}%`
                : '—'}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Overall readiness</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-card">
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Growth Focus</p>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {stats?.problemAreasCount ?? 0}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Identified problem areas</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-blue-100 shadow-card">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Action Items</p>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-1">
              {stats?.recommendationsCount ?? 0}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Admin recommendations</p>
          </div>
        </div>

        {/* ── TABS NAVIGATION & SEARCH ── */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-[#1a3a2a] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 All Feedback ({feedbacks.length})
            </button>
            <button
              onClick={() => setActiveTab('problems')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'problems'
                  ? 'bg-rose-50 text-rose-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Problem Areas ({stats?.problemAreasCount ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'recommendations'
                  ? 'bg-blue-50 text-blue-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💡 Recommendations ({stats?.recommendationsCount ?? 0})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search evaluations..."
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">Loading evaluation reports...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center border border-gray-100 shadow-card">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-base font-bold text-gray-800">No Assessment Feedback Yet</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5">
              Once an administrator reviews your reading assessments, detailed diagnostic feedback, identified problem areas, and personalized suggestions will appear here.
            </p>
            <Link
              to="/student/assessments"
              className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] text-white text-xs font-bold hover:bg-[#2d6a4f] transition-colors inline-block"
            >
              Take an Assessment
            </Link>
          </div>
        ) : (
          <>
            {/* ── TAB 1: ALL FEEDBACK CARDS ── */}
            {activeTab === 'all' && (
              <div className="space-y-5">
                {filteredFeedbacks.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-card space-y-5 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                            Evaluated
                          </span>
                          {item.recommendedLevel && (
                            <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              🎯 Target: {item.recommendedLevel}
                            </span>
                          )}
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
                          {item.assessmentTitle}
                        </h2>
                        <p className="text-xs text-gray-400">
                          Reviewed by <strong>{item.adminName || 'Admin'}</strong> on{' '}
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Overall Score Badge */}
                      {item.overallScore !== null && item.overallScore !== undefined && (
                        <div
                          className={`px-4 py-2 rounded-2xl border flex flex-col items-center justify-center font-black ${getScoreColor(
                            item.overallScore
                          )}`}
                        >
                          <span className="text-2xl leading-none">{item.overallScore}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                            Readiness / 100
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Skill Breakdown Scores (if provided) */}
                    {item.skillScores && Object.keys(item.skillScores).length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Skill Diagnostic Breakdown
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {Object.entries(item.skillScores).map(([skill, val]) => (
                            <div key={skill} className="bg-gray-50/80 border border-gray-200/60 rounded-2xl p-2.5">
                              <span className="text-[11px] text-gray-500 capitalize block truncate">
                                {skill.replace(/([A-Z])/g, ' $1')}
                              </span>
                              <span className="text-base font-bold text-gray-900">{val}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Problem Areas / Weaknesses */}
                    {item.problemAreas && item.problemAreas.length > 0 && (
                      <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <span>🎯</span> Identified Problem Areas & Growth Points:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.problemAreas.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-xl text-xs font-semibold bg-white text-rose-800 border border-rose-200/80 shadow-2xs"
                            >
                              ⚠️ {p}
                            </span>
                          ))}
                        </div>
                        {item.weaknessesSummary && (
                          <p className="text-xs text-rose-800 mt-2 leading-relaxed bg-white/60 p-2.5 rounded-xl border border-rose-100">
                            {item.weaknessesSummary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Admin Qualitative Feedback */}
                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 sm:p-5 space-y-1.5">
                      <p className="text-xs font-bold text-[#1a3a2a] uppercase tracking-wide flex items-center gap-1.5">
                        <span>💬</span> Admin Diagnostic Commentary:
                      </p>
                      <p className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line pl-3 border-l-2 border-[#2d6a4f]">
                        {item.feedback}
                      </p>
                    </div>

                    {/* Actionable Recommendations */}
                    {item.recommendations && item.recommendations.length > 0 && (
                      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wide">
                          <span>💡</span> Recommended Action Steps & Practice:
                        </p>
                        <ul className="space-y-1.5">
                          {item.recommendations.map((rec, idx) => (
                            <li
                              key={idx}
                              className="text-xs text-blue-950 flex items-start gap-2 bg-white/80 p-2 rounded-xl border border-blue-100"
                            >
                              <span className="text-blue-500 font-bold mt-0.5">✓</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Plan */}
                    {item.actionPlan && (
                      <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3.5 text-xs text-purple-900">
                        <strong className="block mb-0.5">🗓️ Strategic Action Plan:</strong>
                        <span>{item.actionPlan}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── TAB 2: PROBLEM AREAS & WEAKNESSES DEEP DIVE ── */}
            {activeTab === 'problems' && (
              <div className="space-y-4">
                <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-5 sm:p-6 text-rose-900">
                  <h3 className="font-extrabold text-base">Identified Reading Problem Areas</h3>
                  <p className="text-xs text-rose-700 mt-1">
                    These are specific areas identified by administrators across your assessments where extra practice and focus will accelerate your growth.
                  </p>
                </div>

                {stats?.allProblemAreas && stats.allProblemAreas.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.allProblemAreas.map((problem, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl p-4 border border-rose-100 shadow-card flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900">{problem}</p>
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            Focus on repeated listening and deliberate syllable sounding during oral exercises.
                          </p>
                          <Link
                            to="/student/karaoke-coach"
                            className="inline-block text-[11px] font-bold text-[#2d6a4f] hover:underline pt-1"
                          >
                            Practice with Live AI Coach →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-card">
                    <p className="text-3xl mb-1">🎉</p>
                    <p className="text-sm font-bold text-gray-800">No major weaknesses identified!</p>
                    <p className="text-xs text-gray-400 mt-1">Keep up your daily reading streak.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: RECOMMENDATIONS & FUTURE IMPROVEMENTS ── */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 sm:p-6 text-blue-900">
                  <h3 className="font-extrabold text-base">Admin Recommendations & Roadmap</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Follow these step-by-step guidance notes provided by administrators to improve fluency, decoding accuracy, and comprehension.
                  </p>
                </div>

                {stats?.allRecommendations && stats.allRecommendations.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stats.allRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl p-4 border border-blue-100 shadow-card flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          💡
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-gray-900">{rec}</p>
                          <p className="text-[11px] text-gray-500">
                            Apply this habit consistently during your reading sessions for best results.
                          </p>
                          <Link
                            to="/student/reading-practice"
                            className="inline-block text-[11px] font-bold text-[#2d6a4f] hover:underline pt-1"
                          >
                            Open Reading Passages →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-card">
                    <p className="text-3xl mb-1">💡</p>
                    <p className="text-sm font-bold text-gray-800">No recommendations posted yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Recommendations will appear here after evaluations.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}
