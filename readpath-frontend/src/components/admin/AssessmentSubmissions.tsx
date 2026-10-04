import React, { useState, useEffect } from 'react';
import { useToast } from '../ui/Toast';

export interface AssessmentSubmission {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  audioUrl?: string;
  duration?: number;
  overallScore?: number;
  fluencyScore?: number;
  accuracyScore?: number;
  phonemicAwarenessScore?: number;
  phonicsDecodingScore?: number;
  vocabularyScore?: number;
  comprehensionScore?: number;
  wordsPerMinute?: number;
  correctWordsPerMinute?: number;
  correctWords?: number;
  totalWords?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  recommendations?: string[];
  recommendedNextLevel?: string;
  intervention?: string;
  assessment: {
    id: string;
    title: string;
    passage: string;
    grade: string;
    skillAreas: string[] | string;
    instructions?: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: string;
    user: {
      email: string;
    };
  };
}

interface AssessmentSubmissionsProps {
  assessmentId?: string;
  onBack?: () => void;
}

export default function AssessmentSubmissions({
  assessmentId,
  onBack
}: AssessmentSubmissionsProps) {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'review'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [assessmentId, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (assessmentId) params.append('assessmentId', assessmentId);

      const response = await fetch(`/api/admin/assessments/submissions/review?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load submissions');
      }

      const data = await response.json();
      setSubmissions(data.data?.submissions || []);
    } catch (error) {
      showToast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierInfo = (score: number) => {
    if (score >= 90) return { label: 'Advanced Reader', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: '🏆' };
    if (score >= 75) return { label: 'Proficient Reader', color: 'bg-[#e8f4f0] text-[#1a3a2a] border-[#2d6a4f]/30', icon: '🌿' };
    if (score >= 60) return { label: 'Developing Reader', color: 'bg-amber-50 text-amber-800 border-amber-300', icon: '📈' };
    return { label: 'Needs Support', color: 'bg-rose-50 text-rose-800 border-rose-300', icon: '🎯' };
  };

  const filteredSubmissions = submissions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const studentName = `${s.student.firstName} ${s.student.lastName}`.toLowerCase();
    return (
      studentName.includes(q) ||
      s.assessment.title.toLowerCase().includes(q) ||
      s.student.grade.toLowerCase().includes(q) ||
      (s.student.user?.email && s.student.user.email.toLowerCase().includes(q))
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SUBMISSIONS LIST
  // ───────────────────────────────────────────────────────────────────────────
  const renderList = () => {
    return (
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              )}
              <h2 className="text-xl font-extrabold text-[#1a3a2a]">
                Assessment Evaluation & Valuation
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Review student audio recordings, assign grades, score out of 100, and publish diagnostic feedback.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students or tests..."
                className="pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] w-48 sm:w-60"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            >
              <option value="">All Submissions</option>
              <option value="SUBMITTED">Pending Evaluation</option>
              <option value="REVIEWED">Evaluated & Graded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-[#2d6a4f] border-t-transparent mb-3" />
            <p className="text-sm font-semibold text-gray-700">Loading student assessment submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 py-16 px-6 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl mx-auto mb-3">
              📋
            </div>
            <h3 className="text-base font-bold text-gray-900">
              {statusFilter === 'SUBMITTED' ? 'No pending assessments' : 'No submissions found'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {statusFilter === 'SUBMITTED'
                ? 'All student reading assessments have been reviewed and evaluated.'
                : 'There are no submissions matching your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map(submission => {
              const isReviewed = submission.status === 'REVIEWED';
              const tier = isReviewed && submission.overallScore !== undefined ? getTierInfo(submission.overallScore) : null;

              return (
                <div
                  key={submission.id}
                  className="bg-white border border-gray-200/80 hover:border-[#2d6a4f]/35 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-[#1a3a2a]">
                        {submission.student.firstName} {submission.student.lastName}
                      </h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                        Grade {submission.student.grade.replace('GRADE_', '')}
                      </span>
                      <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold border ${
                        isReviewed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                      }`}>
                        {isReviewed ? '✓ Evaluated' : '⏳ Pending Evaluation'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {submission.assessment.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                      {submission.submittedAt && (
                        <span>Submitted {formatDate(submission.submittedAt)}</span>
                      )}
                      {submission.duration && (
                        <span>
                          • Duration: {Math.floor(submission.duration / 60)}:{(submission.duration % 60).toString().padStart(2, '0')} min
                        </span>
                      )}
                      {submission.wordsPerMinute ? (
                        <span>• {submission.wordsPerMinute} WPM</span>
                      ) : null}
                    </div>

                    {/* Evaluated Score Pill */}
                    {isReviewed && submission.overallScore !== undefined && tier && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border ${tier.color}`}>
                          <span>{tier.icon}</span>
                          <span>Score: {submission.overallScore}/100</span>
                          <span>({tier.label})</span>
                        </span>
                        {submission.feedback && (
                          <span className="text-xs text-gray-600 italic truncate max-w-md">
                            "{submission.feedback.slice(0, 80)}..."
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 self-start md:self-center">
                    {submission.audioUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const audio = new Audio(submission.audioUrl);
                          audio.play().catch(() => showToast('Could not play recording audio', 'error'));
                        }}
                        className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Listen to student reading recording"
                      >
                        <span>🎙️</span>
                        <span>Listen Audio</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubmission(submission);
                        setActiveView('review');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{isReviewed ? '✏️ Review Valuation' : '⚖️ Evaluate & Grade'}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VALUATION & SCORING FORM
  // ───────────────────────────────────────────────────────────────────────────
  const renderReviewForm = () => {
    if (!selectedSubmission) return null;

    return (
      <EvaluationEditor
        submission={selectedSubmission}
        onBack={() => {
          setActiveView('list');
          setSelectedSubmission(null);
        }}
        onSaveSuccess={() => {
          setActiveView('list');
          setSelectedSubmission(null);
          loadSubmissions();
        }}
      />
    );
  };

  return (
    <div>
      {activeView === 'list' && renderList()}
      {activeView === 'review' && renderReviewForm()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION EDITOR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface EvaluationEditorProps {
  submission: AssessmentSubmission;
  onBack: () => void;
  onSaveSuccess: () => void;
}

function EvaluationEditor({ submission, onBack, onSaveSuccess }: EvaluationEditorProps) {
  const { showToast } = useToast();

  const [scores, setScores] = useState({
    overallScore: submission.overallScore ?? 75,
    fluencyScore: submission.fluencyScore ?? 75,
    accuracyScore: submission.accuracyScore ?? 80,
    phonemicAwarenessScore: submission.phonemicAwarenessScore ?? 70,
    phonicsDecodingScore: submission.phonicsDecodingScore ?? 70,
    vocabularyScore: submission.vocabularyScore ?? 75,
    comprehensionScore: submission.comprehensionScore ?? 75,
    wordsPerMinute: submission.wordsPerMinute ?? 95,
    correctWordsPerMinute: submission.correctWordsPerMinute ?? 90,
    correctWords: submission.correctWords ?? 120,
    totalWords: submission.totalWords ?? 130
  });

  const [feedback, setFeedback] = useState({
    strengths: submission.strengths || [],
    weaknesses: submission.weaknesses || [],
    feedback: submission.feedback || '',
    recommendations: submission.recommendations || [],
    recommendedNextLevel: submission.recommendedNextLevel || submission.student.grade,
    intervention: submission.intervention || ''
  });

  const [saving, setSaving] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);

  // Preset feedback suggestions
  const presetStrengths = [
    'Clear and expressive oral reading phrasing',
    'Accurate phonemic decoding of unfamiliar vocabulary',
    'Self-corrected minor mispronunciations without hesitation',
    'Demonstrated strong reading comprehension and recall'
  ];

  const presetWeaknesses = [
    'Hesitation on complex multi-syllable word endings',
    'Rushing through commas and punctuation pauses',
    'Struggled with vowel digraphs and blends',
    'Needs support with context clue inference'
  ];

  const presetRecommendations = [
    '15 minutes daily paired oral reading with parent or tutor',
    'Practice grade-level phonics flashcards for 5 min daily',
    'Record reading passages in Voice AI Coach for real-time feedback',
    'Focus on pausing and breath control at sentence boundaries'
  ];

  const handleScoreChange = (field: string, val: number) => {
    setScores(prev => ({ ...prev, [field]: Math.max(0, Math.min(100, val)) }));
  };

  const getTier = (score: number) => {
    if (score >= 90) return { label: 'Advanced Reader / Mastery', color: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: '🏆' };
    if (score >= 75) return { label: 'Proficient Reader', color: 'bg-[#e8f4f0] text-[#1a3a2a] border-[#2d6a4f]/30', icon: '🌿' };
    if (score >= 60) return { label: 'Developing Reader', color: 'bg-amber-100 text-amber-900 border-amber-300', icon: '📈' };
    return { label: 'Needs Intervention & Focus', color: 'bg-rose-100 text-rose-900 border-rose-300', icon: '🎯' };
  };

  const toggleAudio = () => {
    if (!submission.audioUrl) return;
    if (isPlayingAudio && audioInstance) {
      audioInstance.pause();
      setIsPlayingAudio(false);
    } else {
      const a = audioInstance || new Audio(submission.audioUrl);
      if (!audioInstance) setAudioInstance(a);
      a.onended = () => setIsPlayingAudio(false);
      a.play().then(() => setIsPlayingAudio(true)).catch(() => {
        showToast('Unable to stream recording audio', 'error');
        setIsPlayingAudio(false);
      });
    }
  };

  const handleSubmit = async () => {
    if (scores.overallScore < 0 || scores.overallScore > 100) {
      showToast('Overall valuation score must be between 0 and 100', 'error');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/assessments/submissions/${submission.id}/score`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        },
        body: JSON.stringify({
          ...scores,
          strengths: feedback.strengths.filter(s => s.trim()),
          weaknesses: feedback.weaknesses.filter(w => w.trim()),
          feedback: feedback.feedback.trim(),
          recommendations: feedback.recommendations.filter(r => r.trim()),
          recommendedNextLevel: feedback.recommendedNextLevel.trim(),
          intervention: feedback.intervention.trim()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit valuation');
      }

      showToast('Assessment valuation and grade published successfully!', 'success');
      onSaveSuccess();
    } catch (err: any) {
      showToast(err.message || 'Failed to save valuation', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tier = getTier(scores.overallScore);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Valuation Header */}
      <div className="bg-gradient-to-r from-[#1a3a2a] via-[#24523b] to-[#12281d] rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 hover:bg-white/20 text-emerald-200 transition-colors mb-2 cursor-pointer"
          >
            ← Back to Submissions
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚖️</span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Student Assessment Valuation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
            Evaluating <strong className="text-white">{submission.student.firstName} {submission.student.lastName}</strong> ({submission.student.grade.replace('GRADE_', 'Grade ')}) · {submission.assessment.title}
          </p>
        </div>

        {submission.audioUrl && (
          <button
            type="button"
            onClick={toggleAudio}
            className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-amber-400 text-[#1a3a2a] animate-pulse'
                : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
            }`}
          >
            <span>{isPlayingAudio ? '⏸️' : '▶️'}</span>
            <span>{isPlayingAudio ? 'Pause Audio' : 'Play Student Audio'}</span>
          </button>
        )}
      </div>

      {/* Two Column Grid: Passage on Left, Valuation Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reading Passage (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-[#1a3a2a] uppercase tracking-wider flex items-center gap-1.5">
                <span>📖</span> Assessment Passage
              </span>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {submission.assessment.passage.split(/\s+/).length} words
              </span>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl p-4 border border-gray-200/70 text-gray-800 text-sm leading-relaxed whitespace-pre-line max-h-[380px] overflow-y-auto">
              {submission.assessment.passage}
            </div>

            {submission.assessment.instructions && (
              <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Instructions:</span>
                <p className="text-gray-700 leading-relaxed">{submission.assessment.instructions}</p>
              </div>
            )}
          </div>

          {/* Reading Metrics Box */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a3a2a] mb-3 flex items-center gap-1.5">
              <span>⚡</span> Live Reading Metrics
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">WPM</span>
                <input
                  type="number"
                  min="0"
                  value={scores.wordsPerMinute}
                  onChange={e => handleScoreChange('wordsPerMinute', parseInt(e.target.value) || 0)}
                  className="w-full text-center text-lg font-black text-[#1a3a2a] bg-transparent focus:outline-none"
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">WCPM</span>
                <input
                  type="number"
                  min="0"
                  value={scores.correctWordsPerMinute}
                  onChange={e => handleScoreChange('correctWordsPerMinute', parseInt(e.target.value) || 0)}
                  className="w-full text-center text-lg font-black text-emerald-700 bg-transparent focus:outline-none"
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Accuracy</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scores.accuracyScore}
                  onChange={e => handleScoreChange('accuracyScore', parseInt(e.target.value) || 0)}
                  className="w-full text-center text-lg font-black text-blue-700 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Valuation & Grading Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Score & Tier Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d4a017] block">
                  PRIMARY VALUATION RESULT
                </span>
                <h3 className="text-lg font-bold text-[#1a3a2a]">
                  Overall Assessment Score (0 - 100)
                </h3>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black border ${tier.color}`}>
                <span>{tier.icon}</span>
                <span>{tier.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scores.overallScore}
                  onChange={e => handleScoreChange('overallScore', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-[#f8faf9] border-2 border-[#2d6a4f]/30 rounded-2xl text-2xl font-black text-[#1a3a2a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  / 100
                </span>
              </div>

              <div className="w-44">
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">
                  Target Grade Level
                </label>
                <select
                  value={feedback.recommendedNextLevel}
                  onChange={e => setFeedback(prev => ({ ...prev, recommendedNextLevel: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1a3a2a] focus:bg-white focus:outline-none"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                    <option key={g} value={`GRADE_${g}`}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Core 5 Skill Scores Grid */}
            <div className="pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2.5">
                Core 5 Reading Skills Valuation (0 - 100)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { field: 'fluencyScore', label: 'Fluency' },
                  { field: 'phonicsDecodingScore', label: 'Phonics & Decoding' },
                  { field: 'phonemicAwarenessScore', label: 'Phonemic Awareness' },
                  { field: 'vocabularyScore', label: 'Vocabulary' },
                  { field: 'comprehensionScore', label: 'Comprehension' },
                  { field: 'accuracyScore', label: 'Oral Accuracy' },
                ].map(item => (
                  <div key={item.field} className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200/70">
                    <label className="block text-[10px] font-bold text-gray-500 truncate mb-1">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={(scores as any)[item.field]}
                      onChange={e => handleScoreChange(item.field, parseInt(e.target.value) || 0)}
                      className="w-full text-sm font-black text-[#1a3a2a] bg-white border border-gray-200 rounded-xl px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-[#2d6a4f]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback & Qualitative Valuation Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a3a2a] flex items-center gap-1.5">
              <span>📝</span> Qualitative Assessment Commentary
            </h4>

            {/* Evaluator Notes Textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Official Feedback & Student Advice
              </label>
              <textarea
                value={feedback.feedback}
                onChange={e => setFeedback(prev => ({ ...prev, feedback: e.target.value }))}
                rows={3}
                placeholder="Provide constructive, encouraging evaluation notes for the student and parent..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            {/* Strengths */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-emerald-800">✅ Strengths Identified</label>
                <div className="flex items-center gap-1">
                  {presetStrengths.slice(0, 2).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, strengths: [...prev.strengths, preset] }))}
                      className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      + {preset.slice(0, 16)}…
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, strengths: [...prev.strengths, ''] }))}
                    className="text-xs font-bold text-[#2d6a4f] hover:underline ml-1"
                  >
                    + Add
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {feedback.strengths.map((str, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={str}
                      onChange={e => {
                        const val = e.target.value;
                        setFeedback(prev => ({ ...prev, strengths: prev.strengths.map((s, idx) => idx === i ? val : s) }));
                      }}
                      placeholder="e.g. Accurate decoding of multi-syllable words"
                      className="flex-1 px-3 py-1.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, strengths: prev.strengths.filter((_, idx) => idx !== i) }))}
                      className="text-gray-400 hover:text-red-500 text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas for Growth */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-800">⚠️ Areas for Growth / Weaknesses</label>
                <div className="flex items-center gap-1">
                  {presetWeaknesses.slice(0, 2).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, weaknesses: [...prev.weaknesses, preset] }))}
                      className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                    >
                      + {preset.slice(0, 16)}…
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, weaknesses: [...prev.weaknesses, ''] }))}
                    className="text-xs font-bold text-[#2d6a4f] hover:underline ml-1"
                  >
                    + Add
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {feedback.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={w}
                      onChange={e => {
                        const val = e.target.value;
                        setFeedback(prev => ({ ...prev, weaknesses: prev.weaknesses.map((item, idx) => idx === i ? val : item) }));
                      }}
                      placeholder="e.g. Pausing at commas and periods"
                      className="flex-1 px-3 py-1.5 bg-amber-50/40 border border-amber-200/60 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, weaknesses: prev.weaknesses.filter((_, idx) => idx !== i) }))}
                      className="text-gray-400 hover:text-red-500 text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-blue-800">💡 Recommended Next Steps</label>
                <div className="flex items-center gap-1">
                  {presetRecommendations.slice(0, 2).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, recommendations: [...prev.recommendations, preset] }))}
                      className="text-[10px] text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                    >
                      + {preset.slice(0, 16)}…
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFeedback(prev => ({ ...prev, recommendations: [...prev.recommendations, ''] }))}
                    className="text-xs font-bold text-[#2d6a4f] hover:underline ml-1"
                  >
                    + Add
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                {feedback.recommendations.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={r}
                      onChange={e => {
                        const val = e.target.value;
                        setFeedback(prev => ({ ...prev, recommendations: prev.recommendations.map((item, idx) => idx === i ? val : item) }));
                      }}
                      placeholder="e.g. 15 min daily oral reading with Live AI Coach"
                      className="flex-1 px-3 py-1.5 bg-blue-50/40 border border-blue-200/60 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFeedback(prev => ({ ...prev, recommendations: prev.recommendations.filter((_, idx) => idx !== i) }))}
                      className="text-gray-400 hover:text-red-500 text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-[#d4a017] text-xs font-extrabold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                    <span>Publishing Valuation…</span>
                  </>
                ) : (
                  <>
                    <span>Publish Valuation & Grade</span>
                    <span>✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}