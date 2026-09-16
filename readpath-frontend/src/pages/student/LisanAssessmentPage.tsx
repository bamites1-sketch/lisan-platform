import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';

function AssessmentRecorder({ onComplete, onReset, disabled }: { onComplete: (blob: Blob, duration: number) => void; onReset: () => void; disabled?: boolean }) {
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [state, setState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(track => track.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const start = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = event => { if (event.data.size > 0) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const nextUrl = URL.createObjectURL(blob)
        setAudioUrl(nextUrl)
        setState('stopped')
        onComplete(blob, seconds)
      }
      recorder.start()
      setSeconds(0)
      setState('recording')
      timerRef.current = setInterval(() => setSeconds(value => value + 1), 1000)
    } catch {
      setError('Microphone access is required to record this assessment.')
    }
  }

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setSeconds(0)
    setState('idle')
    chunksRef.current = []
    onReset()
  }

  const format = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`

  return <div className="space-y-4">
    <div className={`rounded-2xl border p-5 ${state === 'recording' ? 'border-red-200 bg-red-50' : state === 'paused' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-semibold text-gray-800"><span className={`w-3 h-3 rounded-full ${state === 'recording' ? 'bg-red-500 animate-pulse' : state === 'paused' ? 'bg-amber-500' : 'bg-gray-300'}`} />{state === 'recording' ? 'Recording' : state === 'paused' ? 'Paused' : state === 'stopped' ? 'Recording ready' : 'Ready to record'}</span><span className="font-mono text-lg text-gray-800">{format(seconds)}</span></div>
      <p className="text-xs text-gray-500 mt-2">There is no time limit. Pause or stop whenever you finish reading.</p>
    </div>
    {audioUrl && <audio controls src={audioUrl} className="w-full" />}
    <div className="flex flex-wrap gap-2">
      {state === 'idle' && <button onClick={start} disabled={disabled} className="btn-primary">🎙️ Start Recording</button>}
      {state === 'recording' && <><button onClick={() => { recorderRef.current?.pause(); setState('paused') }} className="btn-secondary">Ⅱ Pause</button><button onClick={stop} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl">■ Stop</button></>}
      {state === 'paused' && <><button onClick={() => { recorderRef.current?.resume(); setState('recording') }} className="btn-primary">▶ Resume</button><button onClick={stop} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl">■ Stop</button></>}
      {state === 'stopped' && <button onClick={reset} disabled={disabled} className="btn-secondary">↻ Record Again</button>}
    </div>
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  passage: string;
  grade: string;
  skillAreas: string[];
  instructions?: string;
  status: string;
  createdAt: string;
}

interface AssessmentSubmission {
  id: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  audioUrl?: string;
  duration?: number;
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
  correctWords?: number;
  totalWords?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  recommendations?: string[];
  assessment: Assessment;
  _count: {
    responses: number;
  };
}

const LisanAssessmentPage = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'instructions' | 'recording' | 'submitted'>('instructions');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Assessment not found or not assigned to you');
        }
        throw new Error('Failed to load assessment');
      }

      const data = await response.json();
      const assessmentSubmission = data.data;
      
      // Parse JSON fields
      assessmentSubmission.assessment.skillAreas = JSON.parse(assessmentSubmission.assessment.skillAreas || '[]');
      if (assessmentSubmission.strengths) {
        assessmentSubmission.strengths = JSON.parse(assessmentSubmission.strengths);
      }
      if (assessmentSubmission.weaknesses) {
        assessmentSubmission.weaknesses = JSON.parse(assessmentSubmission.weaknesses);
      }
      if (assessmentSubmission.recommendations) {
        assessmentSubmission.recommendations = JSON.parse(assessmentSubmission.recommendations);
      }

      setSubmission(assessmentSubmission);
      
      // Set initial view based on submission status
      if (assessmentSubmission.status === 'SUBMITTED' || assessmentSubmission.status === 'REVIEWED') {
        setCurrentView('submitted');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };
  const handleStartRecording = () => {
    setCurrentView('recording');
  };

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    setAudioBlob(audioBlob);
    setRecordingDuration(duration);
    setIsRecording(false);
  };

  const handleSubmitRecording = async () => {
    if (!audioBlob || !submission) {
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'assessment-recording.webm');
      formData.append('duration', recordingDuration.toString());

      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to submit recording');
      }

      // Reload submission to get updated status
      await loadAssessment();
      setCurrentView('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit recording');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeRecording = () => {
    setAudioBlob(null);
    setRecordingDuration(0);
    setIsRecording(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!submission) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Assessment Not Found</h2>
            <p className="text-gray-600 mb-4">This assessment may not be assigned to you or may have been removed.</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }
  // Instructions View
  if (currentView === 'instructions') {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎤</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{submission.assessment.title}</h1>
              {submission.assessment.description && (
                <p className="text-gray-600 mb-4">{submission.assessment.description}</p>
              )}
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
                <span>Grade: {submission.assessment.grade.replace('GRADE_', '')}</span>
                <span>•</span>
                <span>Skills: {submission.assessment.skillAreas.join(', ')}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">📖 Instructions</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                {submission.assessment.instructions || 
                 'Please read the passage clearly and at your natural pace. When you are ready, click Start Recording and read the passage aloud.'}
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Reading Passage</h3>
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {submission.assessment.passage}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                {submission.assessment.passage.split(' ').filter(word => word.trim()).length} words
              </p>
            </div>

            <div className="text-center">
              <button
                onClick={handleStartRecording}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Start Recording
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Recording View
  if (currentView === 'recording') {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Recording Assessment</h1>
              <p className="text-gray-600">{submission.assessment.title}</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="text-gray-800 leading-relaxed whitespace-pre-line">
                {submission.assessment.passage}
              </div>
            </div>

            <div className="space-y-6">
              <AssessmentRecorder onComplete={handleRecordingComplete} onReset={handleRetakeRecording} disabled={submitting} />

              {audioBlob && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">Recording Complete</h4>
                      <p className="text-sm text-green-700">
                        Duration: {formatDuration(recordingDuration)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleRetakeRecording}
                        disabled={submitting}
                        className="border border-green-300 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-100 disabled:opacity-50"
                      >
                        Record Again
                      </button>
                      <button
                        onClick={handleSubmitRecording}
                        disabled={submitting}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {submitting ? 'Submitting...' : 'Submit Recording'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => setCurrentView('instructions')}
                  disabled={submitting}
                  className="text-gray-600 hover:text-gray-800 text-sm disabled:opacity-50"
                >
                  ← Back to Instructions
                </button>
              </div>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }
  // Submitted/Results View
  if (currentView === 'submitted') {
    const isReviewed = submission.status === 'REVIEWED';
    
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{isReviewed ? '📊' : '✅'}</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isReviewed ? 'Assessment Results' : 'Recording Submitted Successfully'}
              </h1>
              <p className="text-gray-600 mb-4">{submission.assessment.title}</p>
              
              {submission.submittedAt && (
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                  {new Date(submission.submittedAt).toLocaleTimeString()}
                </p>
              )}
            </div>

            {!isReviewed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
                <h3 className="font-semibold text-yellow-900 mb-2">⏳ Under Review</h3>
                <p className="text-yellow-800 text-sm">
                  Your recording has been submitted successfully. Your teacher/admin will review your reading and provide your results and feedback.
                </p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mb-6 text-center text-xs">
              {['Submitted', 'Under Review', 'Reviewed', 'Result Available'].map((label, index) => {
                const active = isReviewed ? index <= 3 : index <= 1
                return <div key={label}><div className={`mx-auto w-7 h-7 rounded-full flex items-center justify-center font-bold ${active ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{active ? '✓' : index + 1}</div><p className={`mt-2 ${active ? 'text-brand-700 font-semibold' : 'text-gray-400'}`}>{label}</p></div>
              })}
            </div>
            {submission.audioUrl && <audio controls src={submission.audioUrl} className="w-full mb-6" />}

            {isReviewed && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="inline-block bg-blue-50 border-2 border-blue-200 rounded-3xl px-8 py-6">
                    <div className="text-4xl font-bold text-blue-600 mb-1">{submission.overallScore}/100</div>
                    <div className="text-sm text-gray-600 font-medium">Overall Score</div>
                  </div>
                </div>

                {/* Skill Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {submission.phonemicAwarenessScore !== null && submission.phonemicAwarenessScore !== undefined && <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg"><div className="text-2xl font-bold text-purple-600">{submission.phonemicAwarenessScore}</div><div className="text-sm text-gray-600">Phonemic awareness</div></div>}
                  {submission.phonicsDecodingScore !== null && submission.phonicsDecodingScore !== undefined && <div className="text-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg"><div className="text-2xl font-bold text-indigo-600">{submission.phonicsDecodingScore}</div><div className="text-sm text-gray-600">Phonics & decoding</div></div>}
                  {submission.fluencyScore !== null && (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{submission.fluencyScore}</div>
                      <div className="text-sm text-gray-600">Fluency</div>
                    </div>
                  )}
                  {submission.vocabularyScore !== null && submission.vocabularyScore !== undefined && <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg"><div className="text-2xl font-bold text-amber-600">{submission.vocabularyScore}</div><div className="text-sm text-gray-600">Vocabulary</div></div>}
                  {submission.accuracyScore !== null && (
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{submission.accuracyScore}</div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  )}
                  {submission.comprehensionScore !== null && (
                    <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{submission.comprehensionScore}</div>
                      <div className="text-sm text-gray-600">Comprehension</div>
                    </div>
                  )}
                </div>

                {/* Reading Stats */}
                {(submission.wordsPerMinute || submission.correctWords) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Reading Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {submission.wordsPerMinute && (
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{submission.wordsPerMinute}</div>
                          <div className="text-gray-600">Words per minute</div>
                        </div>
                      )}
                      {submission.correctWords && submission.totalWords && (
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {submission.correctWords}/{submission.totalWords}
                          </div>
                          <div className="text-gray-600">Correct words</div>
                        </div>
                      )}
                      {submission.correctWords && submission.totalWords && (
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round((submission.correctWords / submission.totalWords) * 100)}%
                          </div>
                          <div className="text-gray-600">Accuracy rate</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Strengths and Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {submission.strengths && submission.strengths.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-3">✨ Strengths</h3>
                      <ul className="space-y-2">
                        {submission.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submission.weaknesses && submission.weaknesses.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h3 className="font-semibold text-orange-900 mb-3">🎯 Areas to Improve</h3>
                      <ul className="space-y-2">
                        {submission.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Feedback */}
                {submission.feedback && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">💬 Admin Feedback</h3>
                    <p className="text-blue-800 text-sm leading-relaxed whitespace-pre-line">
                      {submission.feedback}
                    </p>
                  </div>
                )}

                {/* Recommendations */}
                {submission.recommendations && submission.recommendations.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h3 className="font-semibold text-indigo-900 mb-3">💡 Recommendations</h3>
                    <ul className="space-y-2">
                      {submission.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-indigo-800 flex items-start gap-2">
                          <span className="text-indigo-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {submission.reviewedAt && (
                  <div className="text-center text-xs text-gray-500">
                    Reviewed on {new Date(submission.reviewedAt).toLocaleDateString()} at{' '}
                    {new Date(submission.reviewedAt).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}

            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return null;
};

export default LisanAssessmentPage;