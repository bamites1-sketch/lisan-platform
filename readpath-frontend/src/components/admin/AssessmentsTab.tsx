import { useState, useEffect, useMemo } from 'react';
import { useToast } from '../ui/Toast';
import { apiUrl } from '../../lib/apiBase';

interface Assessment {
  id: string;
  title: string;
  description?: string;
  passage: string;
  grade: string;
  skillAreas: string[];
  instructions?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalAssigned: number;
    totalSubmissions: number;
    submittedCount: number;
    reviewedCount: number;
    pendingReview: number;
    averageScore?: number;
  };
}

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  user: {
    email: string;
    status: string;
  };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
    status: string;
  };
  _count: {
    students: number;
  };
}

interface Grade {
  grade: string;
  studentCount: number;
}

const GRADE_OPTIONS = [
  'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
  'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
];

const SKILL_OPTIONS = [
  { id: 'fluency', label: 'Fluency', icon: '🎤' },
  { id: 'accuracy', label: 'Accuracy', icon: '🎯' },
  { id: 'comprehension', label: 'Comprehension', icon: '🧠' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚' },
  { id: 'phonics', label: 'Phonics & Decoding', icon: '🔤' }
];

export default function AssessmentsTab() {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'create' | 'assign' | 'edit'>('list');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/admin/assessments'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      const normalized = (data.data?.assessments || []).map((assessment: Assessment & { skillAreas: string[] | string }) => ({
        ...assessment,
        skillAreas: Array.isArray(assessment.skillAreas)
          ? assessment.skillAreas
          : (() => {
              try { return JSON.parse(assessment.skillAreas || '[]') as string[] } catch { return [] }
            })()
      }));
      setAssessments(normalized);
    } catch {
      showToast('Failed to load assessments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (gradeFilter !== 'ALL' && a.grade !== gradeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchPassage = a.passage.toLowerCase().includes(q);
        const matchDesc = a.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchPassage && !matchDesc) return false;
      }
      return true;
    });
  }, [assessments, statusFilter, gradeFilter, searchQuery]);

  // Overall statistics
  const metrics = useMemo(() => {
    const total = assessments.length;
    const published = assessments.filter(a => a.status === 'PUBLISHED').length;
    const drafts = assessments.filter(a => a.status === 'DRAFT').length;
    const totalAssigned = assessments.reduce((acc, a) => acc + (a.stats?.totalAssigned || 0), 0);
    const totalSubmissions = assessments.reduce((acc, a) => acc + (a.stats?.totalSubmissions || 0), 0);
    const pendingReview = assessments.reduce((acc, a) => acc + (a.stats?.pendingReview || 0), 0);
    return { total, published, drafts, totalAssigned, totalSubmissions, pendingReview };
  }, [assessments]);

  const viewSubmissions = (assessmentId: string) => {
    window.location.href = `/admin/assessment-submissions?assessmentId=${assessmentId}`;
  };

  const editAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setActiveView('edit');
  };

  const handleQuickStatusToggle = async (assessment: Assessment) => {
    const nextStatus = assessment.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const response = await fetch(apiUrl(`/api/admin/assessments/${assessment.id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      showToast(`Assessment marked as ${nextStatus}`, 'success');
      loadAssessments();
    } catch {
      showToast('Could not update status', 'error');
    }
  };

  // ─── LIST VIEW ─────────────────────────────────────────────────────────────
  const AssessmentList = () => {
    return (
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/20 mb-1.5">
              <span>📋</span> ACADEMIC VALUATION & ASSESSMENTS
            </div>
            <h1 className="text-2xl font-black text-[#1a3a2a] tracking-tight">
              Reading Assessments
            </h1>
            <p className="text-sm text-gray-500">
              Create, configure, and assign oral reading assessments to students across all grade levels.
            </p>
          </div>

          <button
            onClick={() => setActiveView('create')}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white font-bold text-sm shadow-sm transition-all"
          >
            <span>+</span>
            <span>Create Assessment</span>
          </button>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">Total Tests</span>
            <span className="text-2xl font-black text-[#1a3a2a] mt-0.5 block">{metrics.total}</span>
            <span className="text-[11px] text-gray-500">{metrics.published} published</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-emerald-700 block tracking-wider">Active Published</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{metrics.published}</span>
            <span className="text-[11px] text-emerald-600">Available to students</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-blue-700 block tracking-wider">Total Assigned</span>
            <span className="text-2xl font-black text-blue-700 mt-0.5 block">{metrics.totalAssigned}</span>
            <span className="text-[11px] text-blue-600">Student assignments</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-purple-200 shadow-xs">
            <span className="text-[10px] font-extrabold uppercase text-purple-700 block tracking-wider">Submissions</span>
            <span className="text-2xl font-black text-purple-700 mt-0.5 block">{metrics.totalSubmissions}</span>
            <span className="text-[11px] text-purple-600">Audio recordings</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold uppercase text-amber-700 block tracking-wider">Pending Valuation</span>
            <span className="text-2xl font-black text-amber-700 mt-0.5 block">{metrics.pendingReview}</span>
            <span className="text-[11px] text-amber-600">Awaiting grade & score</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search assessment title or passage text..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Grade selector */}
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="flex-1 md:flex-initial px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Grades</option>
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>Grade {g.replace('GRADE_', '')}</option>
              ))}
            </select>

            {/* Status pills */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-[#1a3a2a] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'PUBLISHED' ? 'Published' : 'Drafts'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Loading reading assessments…</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
            <div className="text-5xl mb-3">📝</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No assessments found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-5">
              {searchQuery || gradeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or filter options.'
                : 'Create your first reading passage assessment to start evaluating student fluency and comprehension.'}
            </p>
            <button
              onClick={() => setActiveView('create')}
              className="inline-flex items-center gap-2 bg-[#2d6a4f] hover:bg-[#1a3a2a] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all"
            >
              <span>+</span>
              <span>Create New Assessment</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAssessments.map(assessment => {
              const wordCount = assessment.passage.split(/\s+/).filter(Boolean).length;
              const estSeconds = Math.round((wordCount / 120) * 60);

              return (
                <div
                  key={assessment.id}
                  className="bg-white border border-gray-200/90 hover:border-[#2d6a4f]/40 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Top Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#e8f4f0] text-[#1a3a2a] border border-[#2d6a4f]/25">
                          Grade {assessment.grade.replace('GRADE_', '')}
                        </span>

                        <span className={`px-2.5 py-0.5 text-xs rounded-full font-bold border ${
                          assessment.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : assessment.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {assessment.status === 'PUBLISHED' ? '● Published & Active' : assessment.status === 'DRAFT' ? '○ Draft' : 'Archived'}
                        </span>

                        <span className="text-xs text-gray-500 font-medium">
                          {wordCount} words · ~{estSeconds}s read
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg font-bold text-[#1a3a2a] group-hover:text-[#2d6a4f] transition-colors leading-snug">
                        {assessment.title}
                      </h2>

                      {assessment.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {assessment.description}
                        </p>
                      )}

                      {/* Passage Excerpt */}
                      <div className="mt-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 text-xs text-gray-700 line-clamp-2 italic">
                        "{assessment.passage.slice(0, 220)}..."
                      </div>

                      {/* Skill Areas */}
                      {assessment.skillAreas && assessment.skillAreas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Skills:</span>
                          {assessment.skillAreas.map(skill => (
                            <span
                              key={skill}
                              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 capitalize border border-gray-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {/* Quick Stats Pill */}
                      {assessment.stats && (
                        <div className="flex items-center gap-3 bg-[#f8faf9] px-3 py-2 rounded-2xl border border-gray-200/80 text-center">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Assigned</span>
                            <span className="text-sm font-black text-[#1a3a2a]">{assessment.stats.totalAssigned}</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Submissions</span>
                            <span className="text-sm font-black text-purple-700">{assessment.stats.totalSubmissions}</span>
                          </div>
                          <span className="text-gray-300">|</span>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Pending</span>
                            <span className="text-sm font-black text-amber-700">{assessment.stats.pendingReview}</span>
                          </div>
                          {assessment.stats.averageScore ? (
                            <>
                              <span className="text-gray-300">|</span>
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase block">Avg</span>
                                <span className="text-sm font-black text-emerald-700">{assessment.stats.averageScore}%</span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setActiveView('assign');
                          }}
                          disabled={assessment.status !== 'PUBLISHED'}
                          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <span>🎯</span>
                          <span>Assign to Students</span>
                        </button>

                        <button
                          onClick={() => viewSubmissions(assessment.id)}
                          className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <span>📊</span>
                          <span>Submissions & Valuation</span>
                        </button>

                        <button
                          onClick={() => editAssessment(assessment)}
                          className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleQuickStatusToggle(assessment)}
                          title={assessment.status === 'PUBLISHED' ? 'Set as Draft' : 'Publish Assessment'}
                          className="p-2 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        >
                          {assessment.status === 'PUBLISHED' ? '⏸️' : '▶️'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ─── ASSIGN FORM COMPONENT ────────────────────────────────────────────────
  const AssignmentForm = () => {
    const [assignmentType, setAssignmentType] = useState<'ALL' | 'GRADE' | 'INDIVIDUAL' | 'PLAN' | 'CLASS'>('ALL');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('BASIC');
    const [dueDate, setDueDate] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [studentSearch, setStudentSearch] = useState('');

    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
      loadAssignmentData();
    }, []);

    const loadAssignmentData = async () => {
      try {
        setLoadingData(true);
        const [studentsRes, teachersRes, gradesRes] = await Promise.all([
          fetch(apiUrl('/api/admin/assessments/helpers/students'), {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
          }),
          fetch(apiUrl('/api/admin/assessments/helpers/teachers'), {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
          }),
          fetch(apiUrl('/api/admin/assessments/helpers/grades'), {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
          })
        ]);

        const [studentsData, teachersData, gradesData] = await Promise.all([
          studentsRes.json(),
          teachersRes.json(),
          gradesRes.json()
        ]);

        setStudents(studentsData.data || []);
        setTeachers(teachersData.data || []);

        const allStandardGrades = GRADE_OPTIONS.map(g => ({ grade: g, studentCount: 0 }));
        const rawGrades: Grade[] = gradesData.data || [];
        const mergedGrades = allStandardGrades.map(sg => {
          const found = rawGrades.find(rg => rg.grade === sg.grade);
          return found ? found : sg;
        });
        setGrades(mergedGrades);
      } catch {
        showToast('Failed to load student & grade lists', 'error');
      } finally {
        setLoadingData(false);
      }
    };

    const handleAssign = async () => {
      if (!selectedAssessment) return;

      let targetIds: string[] = [];
      let targetGrade = '';

      if (assignmentType === 'PLAN') {
        targetGrade = selectedPlan;
      } else if (assignmentType === 'INDIVIDUAL') {
        if (selectedStudents.length === 0) {
          showToast('Please select at least one student', 'error');
          return;
        }
        targetIds = selectedStudents;
      } else if (assignmentType === 'CLASS') {
        if (selectedTeachers.length === 0) {
          showToast('Please select at least one class group', 'error');
          return;
        }
        targetIds = selectedTeachers;
      } else if (assignmentType === 'GRADE') {
        if (!selectedGrade) {
          showToast('Please select a grade level', 'error');
          return;
        }
        targetGrade = selectedGrade;
      }

      try {
        setAssigning(true);
        const response = await fetch(apiUrl(`/api/admin/assessments/${selectedAssessment.id}/assign`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify({
            assignmentType,
            targetIds,
            targetGrade,
            dueDate: dueDate || null,
            note: customNote || null
          })
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to assign assessment');
        }

        const result = await response.json();
        showToast(result.message || 'Assessment assigned successfully! Students can now see it in their dashboard.', 'success');
        setActiveView('list');
        loadAssessments();
      } catch (error: any) {
        showToast(error.message || 'Failed to assign assessment', 'error');
      } finally {
        setAssigning(false);
      }
    };

    const filteredStudents = students.filter(s => {
      const q = studentSearch.toLowerCase();
      const matchName = `${s.firstName} ${s.lastName}`.toLowerCase().includes(q);
      const matchEmail = s.user?.email.toLowerCase().includes(q);
      const matchGrade = s.grade.toLowerCase().includes(q);
      return matchName || matchEmail || matchGrade;
    });

    const setQuickDueDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(23, 59, 0, 0);
      setDueDate(d.toISOString().slice(0, 16));
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1a3a2a] mb-3 transition-colors"
          >
            ← Back to Assessments
          </button>
          <div className="bg-gradient-to-r from-[#1a3a2a] via-[#24523b] to-[#12281d] rounded-3xl p-6 text-white shadow-xl">
            <span className="text-[10px] font-extrabold uppercase text-[#d4a017] tracking-wider block">
              ASSIGN ASSESSMENT WORK
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              Assign "{selectedAssessment?.title}"
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1">
              Assigned students will immediately see this oral reading test in their dashboard, assignments tab, and assessment list.
            </p>
          </div>
        </div>

        {loadingData ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-6">
            {/* Scope Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                Select Assignment Target
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'ALL', label: 'All Active Students', desc: 'Every enrolled student across all grades', icon: '👥' },
                  { id: 'GRADE', label: 'Specific Grade Level', desc: `Target students in one grade (e.g. ${selectedAssessment?.grade})`, icon: '🎓' },
                  { id: 'INDIVIDUAL', label: 'Individual Students', desc: 'Hand-pick specific students to take this test', icon: '👤' },
                  { id: 'PLAN', label: 'By Subscription Plan', desc: 'Target students on Basic, Premium, or Diagnostic', icon: '💳' },
                  { id: 'CLASS', label: 'By Class Group', desc: 'Assign to a specific teacher group', icon: '🏫' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssignmentType(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      assignmentType === opt.id
                        ? 'border-[#2d6a4f] bg-[#e8f4f0]/60 ring-2 ring-[#2d6a4f]/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{opt.icon}</span>
                    <div>
                      <span className="block text-xs font-extrabold text-[#1a3a2a]">{opt.label}</span>
                      <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">{opt.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Selectors */}
            {assignmentType === 'GRADE' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">Choose Grade Level</label>
                <select
                  value={selectedGrade}
                  onChange={e => setSelectedGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  <option value="">Select a grade...</option>
                  {grades.map(g => (
                    <option key={g.grade} value={g.grade}>
                      Grade {g.grade.replace('GRADE_', '')} ({g.studentCount} active students)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assignmentType === 'PLAN' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">Choose Plan</label>
                <select
                  value={selectedPlan}
                  onChange={e => setSelectedPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#2d6a4f]"
                >
                  <option value="BASIC">Basic Plan</option>
                  <option value="PREMIUM">Premium Plan</option>
                  <option value="DIAGNOSTIC">Diagnostic Plan</option>
                </select>
              </div>
            )}

            {assignmentType === 'CLASS' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">Choose Class Group</label>
                <div className="max-h-56 overflow-y-auto space-y-2">
                  {teachers.map(teacher => (
                    <label key={teacher.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedTeachers(p => [...p, teacher.id]);
                            else setSelectedTeachers(p => p.filter(id => id !== teacher.id));
                          }}
                          className="rounded text-[#2d6a4f] focus:ring-[#2d6a4f]"
                        />
                        <span className="text-xs font-bold text-gray-800">
                          {teacher.firstName} {teacher.lastName}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {teacher._count?.students || 0} students
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {assignmentType === 'INDIVIDUAL' && (
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs font-bold text-gray-700">
                    Select Students ({selectedStudents.length} chosen)
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                      className="font-bold text-[#2d6a4f] hover:underline"
                    >
                      Select All Filtered
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => setSelectedStudents([])}
                      className="font-bold text-gray-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Filter students by name, email, or grade..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {filteredStudents.map(student => (
                    <label
                      key={student.id}
                      className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={e => {
                            if (e.target.checked) setSelectedStudents(p => [...p, student.id]);
                            else setSelectedStudents(p => p.filter(id => id !== student.id));
                          }}
                          className="rounded text-[#2d6a4f] focus:ring-[#2d6a4f]"
                        />
                        <div>
                          <span className="block text-xs font-bold text-gray-800">
                            {student.firstName} {student.lastName}
                          </span>
                          <span className="block text-[10px] text-gray-500">{student.user?.email}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Grade {student.grade.replace('GRADE_', '')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Due Date & Presets */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Due Date (Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400">Quick set:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(3)}
                    className="text-[10px] font-bold text-[#2d6a4f] bg-[#e8f4f0] px-2 py-0.5 rounded-lg hover:brightness-95"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(7)}
                    className="text-[10px] font-bold text-[#2d6a4f] bg-[#e8f4f0] px-2 py-0.5 rounded-lg hover:brightness-95"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(14)}
                    className="text-[10px] font-bold text-[#2d6a4f] bg-[#e8f4f0] px-2 py-0.5 rounded-lg hover:brightness-95"
                  >
                    +2 Weeks
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            {/* Instructions / Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Special Instructions or Note for Students
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Optional notes or goals (e.g., 'Please read clearly and take your time on multi-syllable words')..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleAssign}
                disabled={assigning}
                className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {assigning ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Assigning to students…</span>
                  </>
                ) : (
                  <>
                    <span>🎯</span>
                    <span>Confirm & Assign Assessment</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('list')}
                className="py-3 px-5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── CREATE & EDIT FORM ───────────────────────────────────────────────────
  const AssessmentForm = ({ isEdit = false }: { isEdit?: boolean }) => {
    const [formData, setFormData] = useState({
      title: selectedAssessment && isEdit ? selectedAssessment.title : '',
      description: selectedAssessment && isEdit ? selectedAssessment.description || '' : '',
      passage: selectedAssessment && isEdit ? selectedAssessment.passage : '',
      grade: selectedAssessment && isEdit ? selectedAssessment.grade : 'GRADE_1',
      skillAreas: selectedAssessment && isEdit ? selectedAssessment.skillAreas : ['fluency', 'accuracy', 'comprehension'],
      instructions: selectedAssessment && isEdit ? selectedAssessment.instructions || '' : 'Please read the passage clearly and at your natural pace. When you are ready, click Start Recording and read the passage aloud.',
      status: selectedAssessment && isEdit ? selectedAssessment.status : 'PUBLISHED'
    });
    const [saving, setSaving] = useState(false);

    const wordCount = formData.passage.split(/\s+/).filter(Boolean).length;
    const estSeconds = Math.round((wordCount / 120) * 60);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.passage.trim()) {
        showToast('Please enter both a title and passage text', 'error');
        return;
      }

      try {
        setSaving(true);
        const url = isEdit
          ? apiUrl(`/api/admin/assessments/${selectedAssessment?.id}`)
          : apiUrl('/api/admin/assessments');
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Failed to save assessment');
        }

        showToast(
          isEdit ? 'Assessment updated successfully' : 'Assessment created and published successfully!',
          'success'
        );
        setActiveView('list');
        loadAssessments();
      } catch (err: any) {
        showToast(err.message || 'Operation failed', 'error');
      } finally {
        setSaving(false);
      }
    };

    const toggleSkill = (skillId: string) => {
      setFormData(prev => ({
        ...prev,
        skillAreas: prev.skillAreas.includes(skillId)
          ? prev.skillAreas.filter(s => s !== skillId)
          : [...prev.skillAreas, skillId]
      }));
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1a3a2a] mb-3 transition-colors"
          >
            ← Back to Assessments
          </button>
          <div className="bg-gradient-to-r from-[#1a3a2a] via-[#24523b] to-[#12281d] rounded-3xl p-6 text-white shadow-xl">
            <span className="text-[10px] font-extrabold uppercase text-[#d4a017] tracking-wider block">
              {isEdit ? 'UPDATE ASSESSMENT' : 'NEW READING ASSESSMENT'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              {isEdit ? `Edit "${selectedAssessment?.title}"` : 'Create Reading Assessment'}
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1">
              Provide a targeted oral reading passage and set the core reading skills to assess.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-6">
          {/* Status Switcher in Edit mode */}
          {isEdit && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div>
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Availability</span>
                <span className="text-xs font-bold text-gray-900">Current Status: {formData.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, status: 'PUBLISHED' }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    formData.status === 'PUBLISHED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, status: 'DRAFT' }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    formData.status === 'DRAFT'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>
          )}

          {/* Title & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Assessment Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Grade 3 Oral Fluency: The Whispering Tree"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Target Grade Level *
              </label>
              <select
                value={formData.grade}
                onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#2d6a4f]"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>Grade {g.replace('GRADE_', '')}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Description / Learning Goal
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief summary of test objectives or context..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Reading Passage */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Reading Passage *
              </label>
              <span className="text-xs font-bold text-[#2d6a4f] bg-[#e8f4f0] px-2.5 py-0.5 rounded-full border border-[#2d6a4f]/20">
                {wordCount} words · ~{estSeconds} sec reading time
              </span>
            </div>
            <textarea
              required
              rows={8}
              value={formData.passage}
              onChange={e => setFormData(p => ({ ...p, passage: e.target.value }))}
              placeholder="Enter the complete passage that students will read aloud during the voice recording assessment..."
              className="w-full px-3.5 py-3 border border-gray-300 rounded-2xl text-sm leading-relaxed focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Skill Areas */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Skill Areas to Assess
            </label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(skill => {
                const isSelected = formData.skillAreas.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#1a3a2a] text-[#d4a017] border-[#1a3a2a] shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>{skill.icon}</span>
                    <span>{skill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Instructions for Students */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Instructions for Students (Shown prior to recording)
            </label>
            <textarea
              rows={3}
              value={formData.instructions}
              onChange={e => setFormData(p => ({ ...p, instructions: e.target.value }))}
              placeholder="Instructions that will be shown to students before they click Start Recording..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#2d6a4f]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving assessment…</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{isEdit ? 'Update Assessment' : 'Save & Publish Assessment'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="py-3 px-5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div>
      {activeView === 'list' && <AssessmentList />}
      {activeView === 'create' && <AssessmentForm isEdit={false} />}
      {activeView === 'edit' && <AssessmentForm isEdit={true} />}
      {activeView === 'assign' && <AssignmentForm />}
    </div>
  );
}