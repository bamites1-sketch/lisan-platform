import { useState, useEffect } from 'react';
import { useToast } from '../ui/Toast';

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

const AssessmentsTab = () => {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'create' | 'assign' | 'edit'>('list');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Load assessments
  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/assessments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load assessments');
      }

      const data = await response.json();
      const normalized = (data.data.assessments || []).map((assessment: Assessment & { skillAreas: string[] | string }) => ({
        ...assessment,
        skillAreas: Array.isArray(assessment.skillAreas)
          ? assessment.skillAreas
          : (() => {
              try { return JSON.parse(assessment.skillAreas || '[]') as string[] } catch { return [] }
            })()
      }));
      setAssessments(normalized);
    } catch (error) {
      showToast('Failed to load assessments', 'error');
    } finally {
      setLoading(false);
    }
  };
  // Assessment List View Component
  const AssessmentList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Reading Assessments</h2>
            <p className="text-sm text-gray-600 mt-1">Create and manage LISAN reading assessments</p>
          </div>
          <button
            onClick={() => setActiveView('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            Create Assessment
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-500 mb-4">Create your first reading assessment to get started</p>
            <button
              onClick={() => setActiveView('create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Assessment
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        assessment.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-700'
                          : assessment.status === 'DRAFT'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {assessment.status}
                      </span>
                    </div>
                    {assessment.description && (
                      <p className="text-gray-600 text-sm mb-2">{assessment.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Grade: {assessment.grade}</span>
                      <span>Skills: {assessment.skillAreas.join(', ')}</span>
                      <span>Created: {new Date(assessment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {assessment.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{assessment.stats.totalAssigned}</div>
                      <div className="text-xs text-gray-500">Assigned</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">{assessment.stats.submittedCount}</div>
                      <div className="text-xs text-gray-500">Submitted</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">{assessment.stats.pendingReview}</div>
                      <div className="text-xs text-gray-500">Pending Review</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {assessment.stats.averageScore ? `${assessment.stats.averageScore}%` : '-'}
                      </div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAssessment(assessment);
                      setActiveView('assign');
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    disabled={assessment.status !== 'PUBLISHED'}
                  >
                    Assign
                  </button>
                  <button
                    onClick={() => viewSubmissions(assessment.id)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                  >
                    View Submissions
                  </button>
                  <button
                    onClick={() => editAssessment(assessment)}
                    className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Create Assessment Form Component
  const CreateAssessmentForm = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      passage: '',
      grade: 'GRADE_1',
      assignmentType: 'ALL' as 'ALL' | 'GRADE' | 'PLAN' | 'CLASS',
      plan: 'BASIC',
      classId: '',
      skillAreas: ['fluency', 'accuracy', 'comprehension'],
      instructions: 'Please read the passage clearly and at your natural pace. When you are ready, click Start Recording and read the passage aloud.'
    });
    const [saving, setSaving] = useState(false);
    const [classGroups, setClassGroups] = useState<Teacher[]>([]);

    useEffect(() => {
      fetch('/api/admin/assessments/helpers/teachers', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
      }).then(response => response.json()).then(data => setClassGroups(data.data || [])).catch(() => setClassGroups([]));
    }, []);

    const gradeOptions = [
      'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
      'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
    ];

    const skillOptions = ['fluency', 'accuracy', 'comprehension', 'vocabulary', 'phonics'];

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.passage.trim()) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      try {
        setSaving(true);
        const response = await fetch('/api/admin/assessments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to create assessment');
        }

        const created = await response.json();
        const assessmentId = created.data.id;
        const publishResponse = await fetch(`/api/admin/assessments/${assessmentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` },
          body: JSON.stringify({ status: 'PUBLISHED' })
        });
        if (!publishResponse.ok) throw new Error('Could not publish assessment');

        const assignmentBody: Record<string, unknown> = { assignmentType: formData.assignmentType, dueDate: null };
        if (formData.assignmentType === 'GRADE') assignmentBody.targetGrade = formData.grade;
        if (formData.assignmentType === 'PLAN') assignmentBody.targetGrade = formData.plan;
        if (formData.assignmentType === 'CLASS') assignmentBody.targetIds = [formData.classId];
        const assignResponse = await fetch(`/api/admin/assessments/${assessmentId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` },
          body: JSON.stringify(assignmentBody)
        });
        if (!assignResponse.ok) {
          const assignError = await assignResponse.json().catch(() => ({}));
          throw new Error(assignError.message || 'Could not assign assessment');
        }
        showToast('Assessment created and assigned', 'success');
        setActiveView('list');
        loadAssessments();
      } catch (error) {
        showToast('Failed to create assessment', 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleSkillToggle = (skill: string) => {
      setFormData(prev => ({
        ...prev,
        skillAreas: prev.skillAreas.includes(skill)
          ? prev.skillAreas.filter(s => s !== skill)
          : [...prev.skillAreas, skill]
      }));
    };
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back to Assessments
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Create New Assessment</h2>
          <p className="text-sm text-gray-600 mt-1">Create a reading assessment with a passage for students to record</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Grade 3 Reading Fluency Assessment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assign this assessment to *</label>
            <select value={formData.assignmentType} onChange={e => setFormData(prev => ({ ...prev, assignmentType: e.target.value as typeof prev.assignmentType }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="ALL">All active students</option>
              <option value="GRADE">Students in this grade</option>
              <option value="PLAN">Students on a plan</option>
              <option value="CLASS">A class group</option>
            </select>
            {formData.assignmentType === 'PLAN' && <select value={formData.plan} onChange={e => setFormData(prev => ({ ...prev, plan: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"><option value="BASIC">Basic plan</option><option value="PREMIUM">Premium plan</option><option value="DIAGNOSTIC">Diagnostic plan</option></select>}
            {formData.assignmentType === 'CLASS' && <select required value={formData.classId} onChange={e => setFormData(prev => ({ ...prev, classId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2"><option value="">Select class group</option>{classGroups.map(group => <option key={group.id} value={group.id}>Class group: {group.firstName} {group.lastName}</option>)}</select>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this assessment"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Passage *
            </label>
            <textarea
              value={formData.passage}
              onChange={(e) => setFormData(prev => ({ ...prev, passage: e.target.value }))}
              placeholder="Enter the passage that students will read aloud..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.passage.split(' ').filter(word => word.trim()).length} words
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Grade Level *
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {gradeOptions.map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade.replace('GRADE_', '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Skill Areas to Assess
            </label>
            <div className="grid grid-cols-2 gap-2">
              {skillOptions.map(skill => (
                <label key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.skillAreas.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions for Students
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Instructions that will be shown to students before they start recording"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Assessment'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Edit Assessment Form Component
  const EditAssessmentForm = () => {
    const [formData, setFormData] = useState({
      title: selectedAssessment?.title || '',
      description: selectedAssessment?.description || '',
      passage: selectedAssessment?.passage || '',
      grade: selectedAssessment?.grade || 'GRADE_1',
      skillAreas: selectedAssessment ? selectedAssessment.skillAreas : ['fluency', 'accuracy', 'comprehension'],
      instructions: selectedAssessment?.instructions || 'Please read the passage clearly and at your natural pace. When you are ready, click Start Recording and read the passage aloud.'
    });
    const [saving, setSaving] = useState(false);

    const gradeOptions = [
      'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
      'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
    ];

    const skillOptions = ['fluency', 'accuracy', 'comprehension', 'vocabulary', 'phonics'];

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAssessment || !formData.title.trim() || !formData.passage.trim()) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      try {
        setSaving(true);
        const response = await fetch(`/api/admin/assessments/${selectedAssessment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to update assessment');
        }

        showToast('Assessment updated successfully', 'success');
        setActiveView('list');
        setSelectedAssessment(null);
        loadAssessments();
      } catch (error) {
        showToast('Failed to update assessment', 'error');
      } finally {
        setSaving(false);
      }
    };

    const handleSkillToggle = (skill: string) => {
      setFormData(prev => ({
        ...prev,
        skillAreas: prev.skillAreas.includes(skill)
          ? prev.skillAreas.filter(s => s !== skill)
          : [...prev.skillAreas, skill]
      }));
    };

    const handleStatusChange = async (newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
      if (!selectedAssessment) return;

      try {
        setSaving(true);
        const response = await fetch(`/api/admin/assessments/${selectedAssessment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
          throw new Error('Failed to update assessment status');
        }

        showToast(`Assessment ${newStatus.toLowerCase()} successfully`, 'success');
        setActiveView('list');
        setSelectedAssessment(null);
        loadAssessments();
      } catch (error) {
        showToast('Failed to update assessment status', 'error');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back to Assessments
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Edit Assessment</h2>
          <p className="text-sm text-gray-600 mt-1">Update the assessment details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
          {/* Status Management */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Status: {selectedAssessment?.status}</p>
              <p className="text-sm text-gray-600">Change assessment availability</p>
            </div>
            <div className="flex gap-2">
              {selectedAssessment?.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('PUBLISHED')}
                  disabled={saving}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  Publish
                </button>
              )}
              {selectedAssessment?.status !== 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('DRAFT')}
                  disabled={saving}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                >
                  Set as Draft
                </button>
              )}
              {selectedAssessment?.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('ARCHIVED')}
                  disabled={saving}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  Archive
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Grade 3 Reading Fluency Assessment"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this assessment"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Passage *
            </label>
            <textarea
              value={formData.passage}
              onChange={(e) => setFormData(prev => ({ ...prev, passage: e.target.value }))}
              placeholder="Enter the passage that students will read aloud..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.passage.split(' ').filter(word => word.trim()).length} words
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Grade Level *
            </label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {gradeOptions.map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade.replace('GRADE_', '')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Skill Areas to Assess
            </label>
            <div className="grid grid-cols-2 gap-2">
              {skillOptions.map(skill => (
                <label key={skill} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.skillAreas.includes(skill)}
                    onChange={() => handleSkillToggle(skill)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 capitalize">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions for Students
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Instructions that will be shown to students before they start recording"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Assessment'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };
  // Assignment Form Component
  const AssignmentForm = () => {
    const [assignmentType, setAssignmentType] = useState<'ALL' | 'PLAN' | 'INDIVIDUAL' | 'CLASS' | 'GRADE'>('ALL');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('BASIC');
    const [dueDate, setDueDate] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
      if (activeView === 'assign') {
        loadAssignmentData();
      }
    }, [activeView]);

    const loadAssignmentData = async () => {
      try {
        setLoading(true);
        const [studentsRes, teachersRes, gradesRes] = await Promise.all([
          fetch('/api/admin/assessments/helpers/students', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
          }),
          fetch('/api/admin/assessments/helpers/teachers', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
          }),
          fetch('/api/admin/assessments/helpers/grades', {
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
        setGrades(gradesData.data || []);
      } catch (error) {
        showToast('Failed to load assignment data', 'error');
      } finally {
        setLoading(false);
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
          showToast('Please select at least one teacher', 'error');
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
        const response = await fetch(`/api/admin/assessments/${selectedAssessment.id}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify({
            assignmentType,
            targetIds,
            targetGrade,
            dueDate: dueDate || null
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to assign assessment');
        }

        const result = await response.json();
        showToast(result.message, 'success');
        setActiveView('list');
        loadAssessments();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to assign assessment', 'error');
      } finally {
        setAssigning(false);
      }
    };
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back to Assessments
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Assign Assessment</h2>
          <p className="text-sm text-gray-600 mt-1">
            Assign "{selectedAssessment?.title}" to students
          </p>
        </div>

        <div className="space-y-6 bg-white border border-gray-200 rounded-lg p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Assignment Type</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" value="ALL" checked={assignmentType === 'ALL'} onChange={() => setAssignmentType('ALL')} className="text-blue-600" />
                <span className="ml-2 text-sm">All active students</span>
              </label>
              <label className="flex items-center">
                <input type="radio" value="PLAN" checked={assignmentType === 'PLAN'} onChange={() => setAssignmentType('PLAN')} className="text-blue-600" />
                <span className="ml-2 text-sm">Students on a plan</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="INDIVIDUAL"
                  checked={assignmentType === 'INDIVIDUAL'}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="ml-2 text-sm">Individual Students</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CLASS"
                  checked={assignmentType === 'CLASS'}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="ml-2 text-sm">Class group</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="GRADE"
                  checked={assignmentType === 'GRADE'}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="text-blue-600"
                />
                <span className="ml-2 text-sm">Entire Grade Level</span>
              </label>
            </div>
          </div>
          {assignmentType === 'INDIVIDUAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {students.map(student => (
                  <label key={student.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(prev => [...prev, student.id]);
                        } else {
                          setSelectedStudents(prev => prev.filter(id => id !== student.id));
                        }
                      }}
                      className="text-blue-600"
                    />
                    <span className="ml-2 text-sm">
                      {student.firstName} {student.lastName} (Grade {student.grade.replace('GRADE_', '')})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {assignmentType === 'CLASS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class Group</label>
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {teachers.map(teacher => (
                  <label key={teacher.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeachers(prev => [...prev, teacher.id]);
                          } else {
                            setSelectedTeachers(prev => prev.filter(id => id !== teacher.id));
                          }
                        }}
                        className="text-blue-600"
                      />
                      <span className="ml-2 text-sm">
                        Class group: {teacher.firstName} {teacher.lastName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {teacher._count.students} students
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {assignmentType === 'GRADE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Grade Level</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a grade level</option>
                {grades.map(grade => (
                  <option key={grade.grade} value={grade.grade}>
                    Grade {grade.grade.replace('GRADE_', '')} ({grade.studentCount} students)
                  </option>
                ))}
              </select>
            </div>
          )}
          {assignmentType === 'PLAN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Plan</label>
              <select value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="BASIC">Basic plan</option>
                <option value="PREMIUM">Premium plan</option>
                <option value="DIAGNOSTIC">Diagnostic plan</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAssign}
              disabled={assigning}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {assigning ? 'Assigning...' : 'Assign Assessment'}
            </button>
            <button
              onClick={() => setActiveView('list')}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper functions
  const viewSubmissions = (assessmentId: string) => {
    // Navigate to the assessment submissions page
    window.location.href = `/admin/assessment-submissions?assessmentId=${assessmentId}`;
  };

  const editAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setActiveView('edit');
  };

  // Main render
  return (
    <div>
      {activeView === 'list' && <AssessmentList />}
      {activeView === 'create' && <CreateAssessmentForm />}
      {activeView === 'edit' && <EditAssessmentForm />}
      {activeView === 'assign' && <AssignmentForm />}
    </div>
  );
};

export default AssessmentsTab;