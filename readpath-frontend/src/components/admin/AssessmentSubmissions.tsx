import { useState, useEffect } from 'react';
import { useToast } from '../ui/Toast';

interface AssessmentSubmission {
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
    skillAreas: string[];
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

const AssessmentSubmissions: React.FC<AssessmentSubmissionsProps> = ({ 
  assessmentId, 
  onBack 
}) => {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'review'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('SUBMITTED');

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
      setSubmissions(data.data.submissions || []);
    } catch (error) {
      showToast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  // Submissions List Component
  const SubmissionsList = () => {
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
            <div className="flex items-center gap-4 mb-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  ← Back
                </button>
              )}
              <h2 className="text-xl font-semibold text-gray-900">Assessment Submissions</h2>
            </div>
            <p className="text-sm text-gray-600">Review and score student submissions</p>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Submissions</option>
            <option value="SUBMITTED">Pending Review</option>
            <option value="REVIEWED">Reviewed</option>
          </select>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-500">
              {statusFilter === 'SUBMITTED' 
                ? 'No submissions are waiting for review'
                : 'No submissions match your current filter'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.student.firstName} {submission.student.lastName}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{submission.assessment.title}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Grade: {submission.student.grade.replace('GRADE_', '')}</span>
                      {submission.submittedAt && (
                        <span>Submitted: {formatDate(submission.submittedAt)}</span>
                      )}
                      {submission.duration && (
                        <span>Duration: {Math.floor(submission.duration / 60)}:{(submission.duration % 60).toString().padStart(2, '0')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {submission.status === 'REVIEWED' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium text-green-800">
                        Overall Score: {submission.overallScore}/100
                      </span>
                      {submission.reviewedAt && (
                        <span className="text-green-600">
                          Reviewed: {formatDate(submission.reviewedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setActiveView('review');
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    {submission.status === 'REVIEWED' ? 'View Review' : 'Review'}
                  </button>
                  {submission.audioUrl && (
                    <button
                      onClick={() => {
                        const audio = new Audio(submission.audioUrl);
                        audio.play().catch(() => showToast('Could not play audio', 'error'));
                      }}
                      className="border border-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-50"
                    >
                      🎵 Play Audio
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  // Review Form Component
  const ReviewForm = () => {
    const [scores, setScores] = useState({
      overallScore: selectedSubmission?.overallScore || 0,
      fluencyScore: selectedSubmission?.fluencyScore || 0,
      accuracyScore: selectedSubmission?.accuracyScore || 0,
      phonemicAwarenessScore: selectedSubmission?.phonemicAwarenessScore || 0,
      phonicsDecodingScore: selectedSubmission?.phonicsDecodingScore || 0,
      vocabularyScore: selectedSubmission?.vocabularyScore || 0,
      comprehensionScore: selectedSubmission?.comprehensionScore || 0,
      wordsPerMinute: selectedSubmission?.wordsPerMinute || 0,
      correctWordsPerMinute: selectedSubmission?.correctWordsPerMinute || 0,
      correctWords: selectedSubmission?.correctWords || 0,
      totalWords: selectedSubmission?.totalWords || 0
    });
    
    const [feedback, setFeedback] = useState({
      strengths: selectedSubmission?.strengths || [],
      weaknesses: selectedSubmission?.weaknesses || [],
      feedback: selectedSubmission?.feedback || '',
      recommendations: selectedSubmission?.recommendations || [],
      recommendedNextLevel: selectedSubmission?.recommendedNextLevel || '',
      intervention: selectedSubmission?.intervention || ''
    });

    const [saving, setSaving] = useState(false);

    const handleScoreChange = (field: string, value: number) => {
      setScores(prev => ({ ...prev, [field]: value }));
    };

    const addStrength = () => {
      setFeedback(prev => ({
        ...prev,
        strengths: [...prev.strengths, '']
      }));
    };

    const addWeakness = () => {
      setFeedback(prev => ({
        ...prev,
        weaknesses: [...prev.weaknesses, '']
      }));
    };

    const addRecommendation = () => {
      setFeedback(prev => ({
        ...prev,
        recommendations: [...prev.recommendations, '']
      }));
    };

    const updateStrength = (index: number, value: string) => {
      setFeedback(prev => ({
        ...prev,
        strengths: prev.strengths.map((s, i) => i === index ? value : s)
      }));
    };

    const updateWeakness = (index: number, value: string) => {
      setFeedback(prev => ({
        ...prev,
        weaknesses: prev.weaknesses.map((w, i) => i === index ? value : w)
      }));
    };

    const updateRecommendation = (index: number, value: string) => {
      setFeedback(prev => ({
        ...prev,
        recommendations: prev.recommendations.map((r, i) => i === index ? value : r)
      }));
    };

    const removeStrength = (index: number) => {
      setFeedback(prev => ({
        ...prev,
        strengths: prev.strengths.filter((_, i) => i !== index)
      }));
    };

    const removeWeakness = (index: number) => {
      setFeedback(prev => ({
        ...prev,
        weaknesses: prev.weaknesses.filter((_, i) => i !== index)
      }));
    };

    const removeRecommendation = (index: number) => {
      setFeedback(prev => ({
        ...prev,
        recommendations: prev.recommendations.filter((_, i) => i !== index)
      }));
    };
    const handleSubmitReview = async () => {
      if (!selectedSubmission) return;

      if (scores.overallScore < 0 || scores.overallScore > 100) {
        showToast('Overall score must be between 0 and 100', 'error');
        return;
      }

      try {
        setSaving(true);
        const response = await fetch(`/api/admin/assessments/submissions/${selectedSubmission.id}/score`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
          },
          body: JSON.stringify({
            ...scores,
            strengths: feedback.strengths.filter(s => s.trim()),
            weaknesses: feedback.weaknesses.filter(w => w.trim()),
            feedback: feedback.feedback,
            recommendations: feedback.recommendations.filter(r => r.trim()),
            recommendedNextLevel: feedback.recommendedNextLevel,
            intervention: feedback.intervention
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit review');
        }

        showToast('Review submitted successfully', 'success');
        setActiveView('list');
        loadSubmissions();
      } catch (error) {
        showToast('Failed to submit review', 'error');
      } finally {
        setSaving(false);
      }
    };

    if (!selectedSubmission) {
      return <div>No submission selected</div>;
    }

    const isReadOnly = selectedSubmission.status === 'REVIEWED';

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveView('list')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            ← Back to Submissions
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isReadOnly ? 'View Review' : 'Review Submission'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedSubmission.student.firstName} {selectedSubmission.student.lastName} - {selectedSubmission.assessment.title}
              </p>
            </div>
            {selectedSubmission.audioUrl && (
              <button
                onClick={() => {
                  const audio = new Audio(selectedSubmission.audioUrl);
                  audio.play().catch(() => showToast('Could not play audio', 'error'));
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                🎵 Play Recording
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reading Passage */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reading Passage</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-line">
                {selectedSubmission.assessment.passage}
              </p>
            </div>
            {selectedSubmission.assessment.instructions && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2">Instructions:</h4>
                <p className="text-sm text-gray-600">{selectedSubmission.assessment.instructions}</p>
              </div>
            )}
          </div>
          {/* Scoring Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Scoring</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Score (0-100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scores.overallScore}
                  onChange={(e) => handleScoreChange('overallScore', parseInt(e.target.value) || 0)}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 pt-2">Reading skill scores</p>
              <div className="grid grid-cols-2 gap-4">
                {([['phonemicAwarenessScore', 'Phonemic awareness'], ['phonicsDecodingScore', 'Phonics & decoding'], ['vocabularyScore', 'Vocabulary'], ['comprehensionScore', 'Comprehension']] as const).map(([field, label]) => <div key={field}><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label><input type="number" min="0" max="100" value={scores[field]} onChange={e => handleScoreChange(field, parseInt(e.target.value) || 0)} disabled={isReadOnly} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" /></div>)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fluency Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.fluencyScore}
                    onChange={(e) => handleScoreChange('fluencyScore', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accuracy Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scores.accuracyScore}
                    onChange={(e) => handleScoreChange('accuracyScore', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Words Per Minute
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scores.wordsPerMinute}
                    onChange={(e) => handleScoreChange('wordsPerMinute', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Correct Words
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scores.correctWords}
                    onChange={(e) => handleScoreChange('correctWords', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Words
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scores.totalWords}
                    onChange={(e) => handleScoreChange('totalWords', parseInt(e.target.value) || 0)}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WCPM</label>
                  <input type="number" min="0" value={scores.correctWordsPerMinute} onChange={e => handleScoreChange('correctWordsPerMinute', parseInt(e.target.value) || 0)} disabled={isReadOnly} className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Feedback Section */}
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Strengths</label>
                {!isReadOnly && (
                  <button
                    onClick={addStrength}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {feedback.strengths.map((strength, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={strength}
                      onChange={(e) => updateStrength(index, e.target.value)}
                      placeholder="Enter a strength..."
                      disabled={isReadOnly}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                    {!isReadOnly && (
                      <button
                        onClick={() => removeStrength(index)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Areas for Improvement</label>
                {!isReadOnly && (
                  <button
                    onClick={addWeakness}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {feedback.weaknesses.map((weakness, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={weakness}
                      onChange={(e) => updateWeakness(index, e.target.value)}
                      placeholder="Enter an area for improvement..."
                      disabled={isReadOnly}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                    {!isReadOnly && (
                      <button
                        onClick={() => removeWeakness(index)}
                        className="text-red-600 hover:text-red-700 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* General Feedback */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Feedback
            </label>
            <textarea
              value={feedback.feedback}
              onChange={(e) => setFeedback(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Provide detailed feedback about the student's reading performance..."
              rows={4}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Recommended next level</label><input value={feedback.recommendedNextLevel} onChange={e => setFeedback(prev => ({ ...prev, recommendedNextLevel: e.target.value }))} disabled={isReadOnly} placeholder="e.g. Grade 7 passage practice" className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Intervention / next step</label><input value={feedback.intervention} onChange={e => setFeedback(prev => ({ ...prev, intervention: e.target.value }))} disabled={isReadOnly} placeholder="e.g. Fluency practice 3 times weekly" className="w-full px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100" /></div>
          </div>

          {/* Recommendations */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Recommendations</label>
              {!isReadOnly && (
                <button
                  onClick={addRecommendation}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add
                </button>
              )}
            </div>
            <div className="space-y-2">
              {feedback.recommendations.map((rec, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={rec}
                    onChange={(e) => updateRecommendation(index, e.target.value)}
                    placeholder="Enter a recommendation..."
                    disabled={isReadOnly}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                  {!isReadOnly && (
                    <button
                      onClick={() => removeRecommendation(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitReview}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Publishing...' : 'Publish Result'}
              </button>
              <button
                onClick={() => setActiveView('list')}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {activeView === 'list' && <SubmissionsList />}
      {activeView === 'review' && <ReviewForm />}
    </div>
  );
};

export default AssessmentSubmissions;