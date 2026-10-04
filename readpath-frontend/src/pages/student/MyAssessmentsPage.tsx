import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';

export interface AssessmentSubmission {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  submittedAt?: string;
  reviewedAt?: string;
  overallScore?: number;
  fluencyScore?: number;
  accuracyScore?: number;
  phonemicAwarenessScore?: number;
  phonicsDecodingScore?: number;
  vocabularyScore?: number;
  comprehensionScore?: number;
  wordsPerMinute?: number;
  correctWordsPerMinute?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  recommendations?: string[];
  recommendedNextLevel?: string;
  intervention?: string;
  assessment: {
    id: string;
    title: string;
    description?: string;
    passage?: string;
    grade: string;
    skillAreas: string[] | string;
    instructions?: string;
    createdAt: string;
  };
  _count?: {
    responses: number;
  };
}

function parseSkillAreas(value: string[] | string): string[] {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]') as string[]; } catch { return []; }
}

export default function MyAssessmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<{
    all: AssessmentSubmission[];
    grouped: { pending: AssessmentSubmission[]; submitted: AssessmentSubmission[]; reviewed: AssessmentSubmission[] };
    counts: { pending: number; submitted: number; reviewed: number; total: number };
  }>({
    all: [],
    grouped: { pending: [], submitted: [], reviewed: [] },
    counts: { pending: 0, submitted: 0, reviewed: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'reviewed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      
      const sanitizeList = (list: AssessmentSubmission[] = []) =>
        list.map(sub => ({
          ...sub,
          assessment: {
            ...sub.assessment,
            skillAreas: parseSkillAreas(sub.assessment?.skillAreas || [])
          }
        }));

      setAssessments({
        all: sanitizeList(data.data?.all || []),
        grouped: {
          pending: sanitizeList(data.data?.grouped?.pending || []),
          submitted: sanitizeList(data.data?.grouped?.submitted || []),
          reviewed: sanitizeList(data.data?.grouped?.reviewed || [])
        },
        counts: data.data?.counts || { pending: 0, submitted: 0, reviewed: 0, total: 0 }
      });
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTier = (score?: number) => {
    if (score === undefined || score === null) return { label: 'Under Evaluation', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '⏳' };
    if (score >= 90) return { label: 'Advanced Reader / Mastery', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: '🏆' };
    if (score >= 75) return { label: 'Proficient Reader', color: 'bg-[#e8f4f0] text-[#1a3a2a] border-[#2d6a4f]/30', icon: '🌿' };
    if (score >= 60) return { label: 'Developing Reader', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: '📈' };
    return { label: 'Needs Support & Practice', color: 'bg-rose-100 text-rose-900 border-rose-300', icon: '🎯' };
  };

  const currentAssessments = (assessments.grouped[activeTab] || []).filter(sub => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.assessment.title.toLowerCase().includes(q) ||
      (sub.assessment.description && sub.assessment.description.toLowerCase().includes(q))
    );
  });

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3a2a] via-[#224d38] to-[#2d6a4f] p-6 sm:p-8 text-white shadow-xl border border-[#2d6a4f]/40">
          <div className="absolute -right-8 -top-8 w-52 h-52 rounded-full bg-[#d4a017]/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/40 mb-3 tracking-wide">
                <span>ል</span> OFFICIAL READING EVALUATIONS
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                Reading Assessments & Valuations
              </h1>
              <p className="text-emerald-100/80 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
                Take assigned reading diagnostics, record your voice reading, and receive comprehensive evaluations graded out of 100 with actionable feedback from Lisan academic administrators.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/student/assessment-feedback"
                className="px-4 py-2.5 bg-gradient-to-r from-[#d4a017] to-[#b88912] hover:brightness-105 text-[#1a3a2a] text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>📋</span> Diagnostic Roadmap
              </Link>
              <Link
                to="/student/chat"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <span>💬</span> Admin Chat
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Summary Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/80 shadow-xs">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Tests</span>
            <span className="text-2xl sm:text-3xl font-black text-[#1a3a2a] mt-1 block">
              {assessments.counts.total}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Assigned assessments</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-amber-100 shadow-xs">
            <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">To Take</span>
            <span className="text-2xl sm:text-3xl font-black text-amber-700 mt-1 block">
              {assessments.counts.pending}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Ready to record</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-blue-100 shadow-xs">
            <span className="block text-[10px] font-bold text-blue-700 uppercase tracking-wider">Under Review</span>
            <span className="text-2xl sm:text-3xl font-black text-blue-700 mt-1 block">
              {assessments.counts.submitted}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Awaiting admin score</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs">
            <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Evaluated</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 block">
              {assessments.counts.reviewed}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">Graded out of 100</span>
          </div>
        </div>

        {/* Tab Selector & Search */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-[#1a3a2a] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📝 Pending Tests ({assessments.counts.pending})
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'submitted'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ⏳ Under Review ({assessments.counts.submitted})
            </button>
            <button
              onClick={() => setActiveTab('reviewed')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'reviewed'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🏆 Evaluated & Graded ({assessments.counts.reviewed})
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tests..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#2d6a4f] border-t-transparent mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading your assessments...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && currentAssessments.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 py-16 px-6 text-center shadow-xs max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-3">
              {activeTab === 'pending' ? '📝' : activeTab === 'submitted' ? '⏳' : '🏆'}
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {activeTab === 'pending'
                ? 'No pending assessments'
                : activeTab === 'submitted'
                ? 'No assessments under review'
                : 'No evaluated assessments yet'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {activeTab === 'pending'
                ? 'You have completed all assigned assessments. New ones will appear here as soon as they are assigned.'
                : activeTab === 'submitted'
                ? 'Completed assessments will appear here while our academic administration reviews and grades them.'
                : 'Once an administrator reviews your reading test and provides an official grade, it will be displayed here.'}
            </p>
          </div>
        )}

        {/* Assessments List */}
        {!loading && currentAssessments.length > 0 && (
          <div className="space-y-4">
            {currentAssessments.map((sub: AssessmentSubmission) => {
              const isReviewed = sub.status === 'REVIEWED';
              const tier = getTier(sub.overallScore);

              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-3xl border border-gray-200/80 hover:border-[#2d6a4f]/35 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                          <span>📋</span>
                          <span>READING ASSESSMENT</span>
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                          Grade {sub.assessment.grade.replace('GRADE_', '')}
                        </span>
                      </div>

                      <span className={`px-3 py-1 text-xs rounded-full font-bold border ${
                        isReviewed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : sub.status === 'SUBMITTED'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isReviewed
                          ? '✓ Evaluated & Graded'
                          : sub.status === 'SUBMITTED'
                          ? '⏳ Under Admin Review'
                          : '📝 Ready to Take'}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#1a3a2a] group-hover:text-[#2d6a4f] transition-colors">
                        {sub.assessment.title}
                      </h2>
                      {sub.assessment.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                          {sub.assessment.description}
                        </p>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                      <span>Assigned: {formatDate(sub.assessment.createdAt)}</span>
                      {sub.submittedAt && (
                        <span>• Submitted: {formatDate(sub.submittedAt)}</span>
                      )}
                      {sub.reviewedAt && (
                        <span>• Evaluated: {formatDate(sub.reviewedAt)}</span>
                      )}
                      {sub.assessment.skillAreas && (
                        <span>• Skills: {parseSkillAreas(sub.assessment.skillAreas).join(', ')}</span>
                      )}
                    </div>

                    {/* ── VALUATION RESULT BANNER (When Reviewed) ── */}
                    {isReviewed && sub.overallScore !== undefined && (
                      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border border-emerald-200 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-black shadow-2xs">
                              {sub.overallScore}
                            </span>
                            <div>
                              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                                OFFICIAL VALUATION RESULT
                              </span>
                              <span className="text-sm font-extrabold text-[#1a3a2a]">
                                Overall Score: {sub.overallScore} / 100
                              </span>
                            </div>
                          </div>

                          <div className={`px-3 py-1 rounded-xl text-xs font-black border ${tier.color}`}>
                            <span>{tier.icon}</span> {tier.label}
                          </div>
                        </div>

                        {/* Skill Score Breakdown Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-100">
                          {sub.fluencyScore !== undefined && (
                            <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 text-center">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase">Fluency</span>
                              <span className="text-xs font-black text-[#1a3a2a]">{sub.fluencyScore}/100</span>
                            </div>
                          )}
                          {sub.accuracyScore !== undefined && (
                            <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 text-center">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase">Accuracy</span>
                              <span className="text-xs font-black text-blue-700">{sub.accuracyScore}/100</span>
                            </div>
                          )}
                          {sub.phonicsDecodingScore !== undefined && (
                            <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 text-center">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase">Phonics</span>
                              <span className="text-xs font-black text-amber-700">{sub.phonicsDecodingScore}/100</span>
                            </div>
                          )}
                          {sub.comprehensionScore !== undefined && (
                            <div className="bg-white/90 p-2 rounded-xl border border-emerald-100 text-center">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase">Comprehension</span>
                              <span className="text-xs font-black text-purple-700">{sub.comprehensionScore}/100</span>
                            </div>
                          )}
                        </div>

                        {/* Evaluator Notes Quote */}
                        {sub.feedback && (
                          <div className="pt-2 text-xs text-gray-700 italic border-l-2 border-emerald-500 pl-2.5 leading-relaxed">
                            "{sub.feedback}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5 flex-wrap">
                    {sub.status === 'IN_PROGRESS' && (
                      <Link
                        to={`/student/assessments/${sub.assessment.id}`}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <span>🎙️</span>
                        <span>Start Reading Assessment</span>
                        <span>→</span>
                      </Link>
                    )}

                    {sub.status === 'SUBMITTED' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">
                          Submitted for grading
                        </span>
                        <Link
                          to={`/student/assessments/${sub.assessment.id}`}
                          className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                        >
                          Review Recording
                        </Link>
                      </div>
                    )}

                    {isReviewed && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to="/student/assessment-feedback"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                        >
                          <span>📋</span>
                          <span>View Full Evaluation & Roadmap</span>
                        </Link>
                        <Link
                          to={`/student/assessments/${sub.assessment.id}`}
                          className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                        >
                          Review Recording
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}