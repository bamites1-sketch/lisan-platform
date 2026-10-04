import { useState, useEffect } from 'react';
import { assessmentFeedbackApi } from '../../services/feedbackCommunicationApi';
import type { AssessmentFeedbackItem } from '../../types';
import { useToast } from '../ui/Toast';

interface StudentHelper {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  email?: string;
}

export default function AssessmentFeedbackTab() {
  const { showToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<AssessmentFeedbackItem[]>([]);
  const [students, setStudents] = useState<StudentHelper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [overallScore, setOverallScore] = useState<number>(75);
  const [fluencyScore, setFluencyScore] = useState<number>(70);
  const [accuracyScore, setAccuracyScore] = useState<number>(80);
  const [comprehensionScore, setComprehensionScore] = useState<number>(75);
  const [phonicsScore, setPhonicsScore] = useState<number>(70);
  const [problemAreas, setProblemAreas] = useState<string[]>([]);
  const [customProblem, setCustomProblem] = useState('');
  const [weaknessesSummary, setWeaknessesSummary] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [customRecommendation, setCustomRecommendation] = useState('');
  const [recommendedLevel, setRecommendedLevel] = useState('');
  const [actionPlan, setActionPlan] = useState('');

  const presetProblems = [
    'Phonics: Consonant blends & digraphs',
    'Phonics: Multi-syllable word decoding',
    'Fluency: Pauses & hesitation on unfamiliar words',
    'Fluency: Skipping word endings (-ed, -ing)',
    'Vocabulary: Grade-level sight words recognition',
    'Comprehension: Recalling sequence of events'
  ];

  const presetRecommendations = [
    '15 min daily oral paired reading at home',
    'Practice phonics flashcards for 5 minutes daily',
    'Record reading passage twice with self-listening',
    'Focus on pausing at periods and commas',
    'Use Live AI Coach for real-time phoneme feedback',
    'Read bilingual stories to strengthen context clues'
  ];

  useEffect(() => {
    loadData();
  }, [gradeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feedbacksData, studentsRes] = await Promise.all([
        assessmentFeedbackApi.getAdminFeedbacks({ grade: gradeFilter, search }),
        fetch('/api/admin/students', {
          headers: { Authorization: `Bearer ${localStorage.getItem('lisan_token')}` }
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      setFeedbacks(feedbacksData || []);
      if (studentsRes?.data?.students) {
        setStudents(studentsRes.data.students);
        if (studentsRes.data.students.length > 0 && !selectedStudentId) {
          setSelectedStudentId(studentsRes.data.students[0].id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load assessment feedbacks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openCreateModal = () => {
    setEditingId(null);
    setAssessmentTitle('');
    setOverallScore(75);
    setFluencyScore(70);
    setAccuracyScore(80);
    setComprehensionScore(75);
    setPhonicsScore(70);
    setProblemAreas([]);
    setWeaknessesSummary('');
    setFeedbackText('');
    setRecommendations([]);
    setRecommendedLevel('');
    setActionPlan('');
    setShowModal(true);
  };

  const openEditModal = (item: AssessmentFeedbackItem) => {
    setEditingId(item.id);
    setSelectedStudentId(item.studentId);
    setAssessmentTitle(item.assessmentTitle);
    setOverallScore(item.overallScore ?? 75);
    setFluencyScore(item.skillScores?.fluency ?? 70);
    setAccuracyScore(item.skillScores?.accuracy ?? 80);
    setComprehensionScore(item.skillScores?.comprehension ?? 75);
    setPhonicsScore(item.skillScores?.phonics ?? 70);
    setProblemAreas(item.problemAreas || []);
    setWeaknessesSummary(item.weaknessesSummary || '');
    setFeedbackText(item.feedback);
    setRecommendations(item.recommendations || []);
    setRecommendedLevel(item.recommendedLevel || '');
    setActionPlan(item.actionPlan || '');
    setShowModal(true);
  };

  const addProblemArea = (text: string) => {
    if (!text.trim()) return;
    if (!problemAreas.includes(text.trim())) {
      setProblemAreas(prev => [...prev, text.trim()]);
    }
    setCustomProblem('');
  };

  const removeProblemArea = (index: number) => {
    setProblemAreas(prev => prev.filter((_, i) => i !== index));
  };

  const addRecommendation = (text: string) => {
    if (!text.trim()) return;
    if (!recommendations.includes(text.trim())) {
      setRecommendations(prev => [...prev, text.trim()]);
    }
    setCustomRecommendation('');
  };

  const removeRecommendation = (index: number) => {
    setRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Please select a student', 'warning');
      return;
    }
    if (!assessmentTitle.trim()) {
      showToast('Please enter an assessment title', 'warning');
      return;
    }
    if (!feedbackText.trim()) {
      showToast('Please provide diagnostic feedback commentary', 'warning');
      return;
    }

    try {
      setSubmitting(true);
      await assessmentFeedbackApi.saveFeedback({
        id: editingId || undefined,
        studentId: selectedStudentId,
        assessmentTitle: assessmentTitle.trim(),
        overallScore,
        skillScores: {
          fluency: fluencyScore,
          accuracy: accuracyScore,
          comprehension: comprehensionScore,
          phonics: phonicsScore
        },
        problemAreas,
        weaknessesSummary: weaknessesSummary.trim() || undefined,
        feedback: feedbackText.trim(),
        recommendations,
        recommendedLevel: recommendedLevel.trim() || undefined,
        actionPlan: actionPlan.trim() || undefined
      });

      showToast(
        editingId ? 'Assessment feedback updated successfully' : 'Assessment feedback published to student!',
        'success'
      );
      setShowModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save assessment feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment feedback record?')) return;
    try {
      await assessmentFeedbackApi.deleteFeedback(id);
      showToast('Assessment feedback deleted', 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete', 'error');
    }
  };

  // Metrics
  const totalCount = feedbacks.length;
  const avgOverall = feedbacks.length > 0
    ? Math.round(
        feedbacks.map(f => f.overallScore ?? 0).reduce((a, b) => a + b, 0) / feedbacks.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* ── HEADER & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#1a3a2a]">Assessment Feedback & Recommendations</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluate reading assessments, diagnose problem areas, and provide actionable improvement plans for students.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#1a3a2a] hover:brightness-110 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto active:scale-95"
        >
          <span>✍️</span> Submit Assessment Feedback
        </button>
      </div>

      {/* ── METRICS SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Evaluations</p>
          <p className="text-2xl sm:text-3xl font-black text-[#1a3a2a] mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Student Score</p>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{avgOverall}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Students</p>
          <p className="text-2xl sm:text-3xl font-black text-[#d4a017] mt-1">{students.length}</p>
        </div>
      </div>

      {/* ── CONTROLS & SEARCH ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[220px] relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student, assessment title, problem area, or recommendation..."
            className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
        </form>

        <div className="flex items-center gap-2">
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none"
          >
            <option value="ALL">All Grades</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => (
              <option key={g} value={`GRADE_${g}`}>
                Grade {g}
              </option>
            ))}
          </select>

          <button
            onClick={loadData}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── FEEDBACKS LIST ── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-[#2d6a4f] rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading assessment evaluations...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-card">
          <p className="text-4xl mb-2">📋</p>
          <h3 className="text-sm font-bold text-gray-800">No Assessment Feedbacks Found</h3>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Click "Submit Assessment Feedback" above to publish evaluations, identify problem areas, and provide recommendations for students.
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-[#1a3a2a] text-white text-xs font-bold hover:bg-[#2d6a4f] transition-colors"
          >
            Submit First Feedback
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(f => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-4 hover:border-gray-300 transition-colors"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-sm text-[#1a3a2a]">
                      {f.student?.firstName} {f.student?.lastName}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Grade {f.student?.grade?.replace('GRADE_', '')}
                    </span>
                    {f.recommendedLevel && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        🎯 Target: {f.recommendedLevel}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">{f.assessmentTitle}</h3>
                  <p className="text-[11px] text-gray-400">
                    Evaluated by <strong>{f.adminName || 'Admin'}</strong> ·{' '}
                    {new Date(f.createdAt).toLocaleDateString()} at{' '}
                    {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {f.overallScore !== null && f.overallScore !== undefined && (
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-center">
                      <span className="text-lg font-black leading-none block">{f.overallScore}%</span>
                      <span className="text-[9px] uppercase font-bold text-emerald-600">Readiness</span>
                    </div>
                  )}

                  <button
                    onClick={() => openEditModal(f)}
                    className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Skill Scores pills */}
              {f.skillScores && Object.keys(f.skillScores).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(f.skillScores).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-700 font-medium"
                    >
                      <span className="text-gray-400 capitalize">{k}:</span> <strong className="text-gray-900">{v}%</strong>
                    </span>
                  ))}
                </div>
              )}

              {/* Problem Areas */}
              {f.problemAreas && f.problemAreas.length > 0 && (
                <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1">
                    <span>🎯</span> Identified Problem Areas:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.problemAreas.map((p, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white text-rose-800 border border-rose-200"
                      >
                        ⚠️ {p}
                      </span>
                    ))}
                  </div>
                  {f.weaknessesSummary && (
                    <p className="text-xs text-rose-900/80 mt-1">{f.weaknessesSummary}</p>
                  )}
                </div>
              )}

              {/* Feedback Commentary */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-1">
                <p className="text-[11px] font-bold text-[#1a3a2a] uppercase tracking-wide">
                  💬 Diagnostic Commentary:
                </p>
                <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line pl-2 border-l-2 border-[#2d6a4f]">
                  {f.feedback}
                </p>
              </div>

              {/* Recommendations */}
              {f.recommendations && f.recommendations.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 space-y-1.5">
                  <p className="text-[11px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1">
                    <span>💡</span> Recommendations for Improvement:
                  </p>
                  <ul className="space-y-1">
                    {f.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-blue-950 flex items-start gap-1.5">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL: SUBMIT / EDIT ASSESSMENT FEEDBACK ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1a3a2a] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingId ? 'Edit Assessment Feedback' : 'Submit Assessment Feedback'}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Provide diagnostic findings, problem areas, and recommendations for the student
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Student Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  disabled={!!editingId}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (Grade {s.grade.replace('GRADE_', '')}) - {s.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assessment Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Assessment Title / Milestone *
                </label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={e => setAssessmentTitle(e.target.value)}
                  placeholder="e.g., Grade 3 Fluency & Decoding Diagnostic, Term 1 Oral Reading Review"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  required
                />
              </div>

              {/* Scores Grid */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Overall Readiness Score: <span className="text-[#2d6a4f] text-sm">{overallScore}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overallScore}
                    onChange={e => setOverallScore(Number(e.target.value))}
                    className="w-40"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-200">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Fluency</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={fluencyScore}
                      onChange={e => setFluencyScore(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Accuracy</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={accuracyScore}
                      onChange={e => setAccuracyScore(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Comprehension</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={comprehensionScore}
                      onChange={e => setComprehensionScore(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Phonics</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={phonicsScore}
                      onChange={e => setPhonicsScore(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ── PROBLEM AREAS BUILDER ── */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
                  Identified Problem Areas & Weaknesses
                </label>
                <p className="text-[11px] text-gray-500">
                  Click preset chips below or type a custom problem area:
                </p>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {presetProblems.map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => addProblemArea(p)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        problemAreas.includes(p)
                          ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-rose-50'
                      }`}
                    >
                      + {p}
                    </button>
                  ))}
                </div>

                {/* Custom Problem Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customProblem}
                    onChange={e => setCustomProblem(e.target.value)}
                    placeholder="Type custom problem area..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addProblemArea(customProblem);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addProblemArea(customProblem)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Problems List */}
                {problemAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-rose-50/50 border border-rose-200 rounded-xl">
                    {problemAreas.map((p, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-rose-800 border border-rose-200 flex items-center gap-1.5"
                      >
                        <span>⚠️ {p}</span>
                        <button
                          type="button"
                          onClick={() => removeProblemArea(i)}
                          className="text-rose-400 hover:text-rose-700 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Diagnostic Feedback Commentary */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Detailed Feedback Commentary *
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Provide comprehensive review of performance, vocal inflection, accuracy, and overall reading confidence..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
                  required
                />
              </div>

              {/* ── RECOMMENDATIONS BUILDER ── */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider">
                  Recommendations & Future Improvement Suggestions
                </label>
                <p className="text-[11px] text-gray-500">
                  Select recommendations to guide the student's upcoming practice:
                </p>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {presetRecommendations.map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => addRecommendation(r)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        recommendations.includes(r)
                          ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-blue-50'
                      }`}
                    >
                      + {r}
                    </button>
                  ))}
                </div>

                {/* Custom Recommendation Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customRecommendation}
                    onChange={e => setCustomRecommendation(e.target.value)}
                    placeholder="Type custom recommendation..."
                    className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRecommendation(customRecommendation);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addRecommendation(customRecommendation)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Recommendations List */}
                {recommendations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-blue-50/50 border border-blue-200 rounded-xl">
                    {recommendations.map((r, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-blue-800 border border-blue-200 flex items-center gap-1.5"
                      >
                        <span>💡 {r}</span>
                        <button
                          type="button"
                          onClick={() => removeRecommendation(i)}
                          className="text-blue-400 hover:text-blue-700 font-bold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Level & Action Plan */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Recommended Target Level
                  </label>
                  <input
                    type="text"
                    value={recommendedLevel}
                    onChange={e => setRecommendedLevel(e.target.value)}
                    placeholder="e.g., Grade 3 Level B, Advanced Fluency"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Action Plan / Weekly Milestone
                  </label>
                  <input
                    type="text"
                    value={actionPlan}
                    onChange={e => setActionPlan(e.target.value)}
                    placeholder="e.g., Complete 3 fluency passages before Friday"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#1a3a2a] hover:bg-[#2d6a4f] text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Feedback' : 'Publish & Notify Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
