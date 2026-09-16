import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';

interface AssessmentSubmission {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  submittedAt?: string;
  reviewedAt?: string;
  overallScore?: number;
  assessment: {
    id: string;
    title: string;
    description?: string;
    grade: string;
    skillAreas: string[] | string;
    createdAt: string;
  };
  _count: {
    responses: number;
  };
}

function parseSkillAreas(value: string[] | string): string[] {
  if (Array.isArray(value)) return value
  try { return JSON.parse(value || '[]') as string[] } catch { return [] }
}

const MyAssessmentsPage = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<{ all: AssessmentSubmission[], grouped: any, counts: any }>({
    all: [],
    grouped: { pending: [], submitted: [], reviewed: [] },
    counts: { pending: 0, submitted: 0, reviewed: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted' | 'reviewed'>('pending');

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
      
      // Parse skill areas for each assessment
      const processedData = {
        ...data.data,
        all: data.data.all.map((submission: AssessmentSubmission) => ({
          ...submission,
          assessment: {
            ...submission.assessment,
            skillAreas: parseSkillAreas(submission.assessment.skillAreas)
          }
        })),
        grouped: {
          pending: data.data.grouped.pending.map((submission: AssessmentSubmission) => ({
            ...submission,
            assessment: {
              ...submission.assessment,
              skillAreas: parseSkillAreas(submission.assessment.skillAreas)
            }
          })),
          submitted: data.data.grouped.submitted.map((submission: AssessmentSubmission) => ({
            ...submission,
            assessment: {
              ...submission.assessment,
              skillAreas: parseSkillAreas(submission.assessment.skillAreas)
            }
          })),
          reviewed: data.data.grouped.reviewed.map((submission: AssessmentSubmission) => ({
            ...submission,
            assessment: {
              ...submission.assessment,
              skillAreas: parseSkillAreas(submission.assessment.skillAreas)
            }
          }))
        }
      };
      
      setAssessments(processedData);
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEWED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'Not Started';
      case 'SUBMITTED':
        return 'Under Review';
      case 'REVIEWED':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const currentAssessments = assessments.grouped[activeTab] || [];
  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assessments</h1>
          <p className="text-gray-600">View and complete your assigned reading assessments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{assessments.counts.total}</div>
            <div className="text-sm text-gray-600">Total Assigned</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{assessments.counts.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{assessments.counts.submitted}</div>
            <div className="text-sm text-gray-600">Under Review</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{assessments.counts.reviewed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({assessments.counts.pending})
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submitted'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Under Review ({assessments.counts.submitted})
            </button>
            <button
              onClick={() => setActiveTab('reviewed')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviewed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({assessments.counts.reviewed})
            </button>
          </nav>
        </div>

        {/* Assessment List */}
        {currentAssessments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {activeTab === 'pending' ? '📝' : activeTab === 'submitted' ? '⏳' : '🏆'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'pending' && 'No pending assessments'}
              {activeTab === 'submitted' && 'No assessments under review'}
              {activeTab === 'reviewed' && 'No completed assessments'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'pending' && 'Check back later for new assessments from the admin.'}
              {activeTab === 'submitted' && 'Complete some assessments to see them here.'}
              {activeTab === 'reviewed' && 'Your completed assessments will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentAssessments.map((submission: AssessmentSubmission) => (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{submission.assessment.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(submission.status)}`}>
                        {getStatusLabel(submission.status)}
                      </span>
                      {submission.status === 'REVIEWED' && submission.overallScore && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full font-medium">
                          Score: {submission.overallScore}/100
                        </span>
                      )}
                    </div>
                    {submission.assessment.description && (
                      <p className="text-gray-600 text-sm mb-2">{submission.assessment.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Grade: {submission.assessment.grade.replace('GRADE_', '')}</span>
                      <span>Skills: {parseSkillAreas(submission.assessment.skillAreas).join(', ')}</span>
                      <span>Assigned: {formatDate(submission.assessment.createdAt)}</span>
                      {submission.submittedAt && (
                        <span>Submitted: {formatDate(submission.submittedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  {submission.status === 'IN_PROGRESS' && (
                    <Link
                      to={`/student/assessments/${submission.assessment.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Start Assessment
                    </Link>
                  )}
                  {submission.status === 'SUBMITTED' && (
                    <span className="text-blue-600 text-sm font-medium">Waiting for review...</span>
                  )}
                  {submission.status === 'REVIEWED' && (
                    <Link
                      to={`/student/assessments/${submission.assessment.id}`}
                      className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      View Results
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default MyAssessmentsPage;