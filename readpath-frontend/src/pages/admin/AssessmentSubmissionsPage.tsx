import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../../lib/apiBase';
import { useToast } from '../../components/ui/Toast';
import { AudioPlayer } from '../../components/admin/RecordingsTab';

interface AssessmentSubmission {
  id: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  audioUrl?: string;
  duration?: number;
  submittedAt?: string;
  reviewedAt?: string;
  overallScore?: number;
  fluencyScore?: number;
  accuracyScore?: number;
  comprehensionScore?: number;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  feedback?: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    grade: string;
  };
  assignment: {
    id: string;
    assignedAt: string;
    dueDate?: string;
  };
}

interface Assessment {
  id: string;
  title: string;
  passage: string;
  grade: string;
  status: string;
}

const AssessmentSubmissionsPage = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  // Get assessmentId from URL params
  const searchParams = new URLSearchParams(location.search);
  const assessmentId = searchParams.get('assessmentId');

  useEffect(() => {
    if (assessmentId) {
      loadAssessmentAndSubmissions();
    } else {
      navigate('/admin/dashboard');
    }
  }, [assessmentId]);

  const loadAssessmentAndSubmissions = async () => {
    try {
      setLoading(true);
      
      // Load assessment details and submissions
      const [assessmentRes, submissionsRes] = await Promise.all([
        fetch(apiUrl(`/api/admin/assessments/${assessmentId}`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
        }),
        fetch(apiUrl(`/api/admin/assessments/submissions/review?assessmentId=${assessmentId}`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('lisan_token')}` }
        })
      ]);

      if (!assessmentRes.ok || !submissionsRes.ok) {
        throw new Error('Failed to load data');
      }

      const [assessmentData, submissionsData] = await Promise.all([
        assessmentRes.json(),
        submissionsRes.json()
      ]);

      setAssessment(assessmentData.data);
      setSubmissions(submissionsData.data || []);
    } catch (error) {
      showToast('Failed to load assessment submissions', 'error');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const startReview = (submission: AssessmentSubmission) => {
    setSelectedSubmission(submission);
    setReviewMode(true);
  };

  const submitReview = async (reviewData: any) => {
    if (!selectedSubmission) return;

    try {
      const response = await fetch(apiUrl(`/api/admin/assessments/submissions/${selectedSubmission.id}/score`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      showToast('Review submitted successfully', 'success');
      setReviewMode(false);
      setSelectedSubmission(null);
      loadAssessmentAndSubmissions();
    } catch (error) {
      showToast('Failed to submit review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Assessment not found</h2>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-gray-600 mt-1">Grade {assessment.grade.replace('GRADE_', '')} • Assessment Submissions</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
            <div className="text-sm text-gray-500">Total Submissions</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'SUBMITTED').length}
            </div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">
              {submissions.filter(s => s.status === 'REVIEWED').length}
            </div>
            <div className="text-sm text-gray-500">Reviewed</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {submissions.filter(s => s.status === 'ASSIGNED' || s.status === 'IN_PROGRESS').length}
            </div>
            <div className="text-sm text-gray-500">Not Submitted</div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Student Submissions</h2>
          </div>
          
          {submissions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">No submissions yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {submission.student.firstName} {submission.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Grade {submission.student.grade.replace('GRADE_', '')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          submission.status === 'REVIEWED' 
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'SUBMITTED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.submittedAt 
                          ? new Date(submission.submittedAt).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {submission.overallScore ? `${submission.overallScore}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {submission.status === 'SUBMITTED' && (
                            <button
                              onClick={() => startReview(submission)}
                              className="text-blue-600 hover:text-blue-900 font-semibold text-xs py-1 px-2.5 rounded-lg hover:bg-blue-50"
                            >
                              Review
                            </button>
                          )}
                          {submission.status === 'REVIEWED' && (
                            <button
                              onClick={() => startReview(submission)}
                              className="text-green-600 hover:text-green-900 font-semibold text-xs py-1 px-2.5 rounded-lg hover:bg-green-50"
                            >
                              View Review
                            </button>
                          )}
                          {submission.audioUrl && (
                            <button
                              onClick={() => startReview(submission)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#e8f4f0] text-[#1a3a2a] hover:bg-[#2d6a4f] hover:text-white transition-all shadow-2xs border border-[#2d6a4f]/25"
                              title="Listen to student recording & review"
                            >
                              <span>🎙️</span>
                              <span>Listen &amp; Grade</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewMode && selectedSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full mx-auto max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900">
                  Review Submission: {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Grade {selectedSubmission.student.grade?.replace('GRADE_', '')} · {assessment.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Assessment Passage */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Reading Passage</h4>
                <div className="bg-gray-50 border border-gray-200/80 p-4 rounded-2xl">
                  <p className="text-gray-800 leading-relaxed text-sm sm:text-base font-serif">{assessment.passage}</p>
                </div>
              </div>

              {/* Professional Audio Player */}
              {selectedSubmission.audioUrl && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <span>🎙️</span> Student Audio Recording
                  </h4>
                  <AudioPlayer
                    src={selectedSubmission.audioUrl}
                    passageTitle={assessment.title}
                    studentName={`${selectedSubmission.student.firstName} ${selectedSubmission.student.lastName}`}
                    initialDuration={selectedSubmission.duration || 0}
                  />
                </div>
              )}

              {/* Review Form */}
              <ReviewForm 
                submission={selectedSubmission}
                onSubmit={submitReview}
                onCancel={() => setReviewMode(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Review Form Component
const ReviewForm = ({ submission, onSubmit, onCancel }: {
  submission: AssessmentSubmission;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    overallScore: submission.overallScore || 0,
    fluencyScore: submission.fluencyScore || 0,
    accuracyScore: submission.accuracyScore || 0,
    comprehensionScore: submission.comprehensionScore || 0,
    strengths: submission.strengths || '',
    weaknesses: submission.weaknesses || '',
    recommendations: submission.recommendations || '',
    feedback: submission.feedback || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overall Score (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.overallScore}
            onChange={(e) => setFormData(prev => ({ ...prev, overallScore: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fluency (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.fluencyScore}
            onChange={(e) => setFormData(prev => ({ ...prev, fluencyScore: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Accuracy (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.accuracyScore}
            onChange={(e) => setFormData(prev => ({ ...prev, accuracyScore: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comprehension (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.comprehensionScore}
            onChange={(e) => setFormData(prev => ({ ...prev, comprehensionScore: Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Feedback */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strengths
          </label>
          <textarea
            value={formData.strengths}
            onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="What did the student do well?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Areas for Improvement
          </label>
          <textarea
            value={formData.weaknesses}
            onChange={(e) => setFormData(prev => ({ ...prev, weaknesses: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="What can the student work on?"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recommendations
        </label>
        <textarea
          value={formData.recommendations}
          onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Specific recommendations for improvement"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          General Feedback
        </label>
        <textarea
          value={formData.feedback}
          onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Overall feedback for the student"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Submit Review
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AssessmentSubmissionsPage;