import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentLayout from '../../components/layout/StudentLayout';
import InteractivePassage from '../../components/ui/InteractivePassage';
import { apiUrl } from '../../lib/apiBase';

function AssessmentRecorder({
  onComplete,
  onReset,
  disabled
}: {
  onComplete: (blob: Blob, duration: number) => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const start = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const nextUrl = URL.createObjectURL(blob);
        setAudioUrl(nextUrl);
        setState('stopped');
        onComplete(blob, seconds);
      };

      recorder.start(250);
      setSeconds(0);
      setState('recording');
      timerRef.current = setInterval(() => setSeconds(value => value + 1), 1000);
    } catch {
      setError('Microphone access is required to record your oral reading. Please allow microphone permissions.');
    }
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setState('idle');
    chunksRef.current = [];
    onReset();
  };

  const format = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-3xl border p-5 transition-all ${
          state === 'recording'
            ? 'border-red-300 bg-red-50/70 shadow-sm'
            : state === 'paused'
            ? 'border-amber-300 bg-amber-50/70'
            : state === 'stopped'
            ? 'border-emerald-300 bg-emerald-50/60'
            : 'border-gray-200 bg-gray-50/80'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                state === 'recording'
                  ? 'bg-red-500 animate-pulse'
                  : state === 'paused'
                  ? 'bg-amber-500'
                  : state === 'stopped'
                  ? 'bg-emerald-600'
                  : 'bg-gray-300'
              }`}
            />
            <span className="text-xs sm:text-sm font-bold text-gray-800">
              {state === 'recording'
                ? 'Recording in Progress…'
                : state === 'paused'
                ? 'Recording Paused'
                : state === 'stopped'
                ? 'Recording Completed & Ready to Review'
                : 'Ready to Record Passage'}
            </span>
          </div>
          <span className="font-mono text-xl font-black text-gray-900 tracking-wider">
            {format(seconds)}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {state === 'recording'
            ? 'Read clearly and out loud. When you finish reading the entire text, click Stop.'
            : state === 'stopped'
            ? 'Listen to your recording below. If satisfied, click Submit Recording to send to admin for valuation.'
            : 'Take your time. There is no penalty for pausing or taking breaths.'}
        </p>
      </div>

      {audioUrl && (
        <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-2">
          <span className="text-[11px] font-bold uppercase text-gray-400 block tracking-wider">
            Preview Your Audio Recording
          </span>
          <audio controls src={audioUrl} className="w-full h-10" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {state === 'idle' && (
          <button
            onClick={start}
            disabled={disabled}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>🎙️</span>
            <span>Start Voice Recording</span>
          </button>
        )}

        {state === 'recording' && (
          <>
            <button
              onClick={() => {
                recorderRef.current?.pause();
                setState('paused');
              }}
              className="py-3 px-5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 font-bold text-sm hover:bg-amber-100 transition-colors"
            >
              ⏸ Pause
            </button>
            <button
              onClick={stop}
              className="flex-1 py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>⏹</span>
              <span>Finish Reading & Stop</span>
            </button>
          </>
        )}

        {state === 'paused' && (
          <>
            <button
              onClick={() => {
                recorderRef.current?.resume();
                setState('recording');
              }}
              className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>▶</span>
              <span>Resume Reading</span>
            </button>
            <button
              onClick={stop}
              className="py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
            >
              ⏹ Stop
            </button>
          </>
        )}

        {state === 'stopped' && (
          <button
            onClick={reset}
            disabled={disabled}
            className="py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
          >
            ↻ Record Again
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {error}
        </div>
      )}
    </div>
  );
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
  recommendedNextLevel?: string;
  intervention?: string;
  assessment: Assessment;
  _count?: {
    responses: number;
  };
}

export default function LisanAssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<AssessmentSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'instructions' | 'recording' | 'submitted'>('instructions');
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
      setError(null);
      const response = await fetch(apiUrl(`/api/assessments/${assessmentId}`), {
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

      // Safely parse JSON fields
      if (typeof assessmentSubmission.assessment?.skillAreas === 'string') {
        try {
          assessmentSubmission.assessment.skillAreas = JSON.parse(assessmentSubmission.assessment.skillAreas);
        } catch {
          assessmentSubmission.assessment.skillAreas = [];
        }
      }

      if (typeof assessmentSubmission.strengths === 'string') {
        try { assessmentSubmission.strengths = JSON.parse(assessmentSubmission.strengths); } catch { assessmentSubmission.strengths = []; }
      }
      if (typeof assessmentSubmission.weaknesses === 'string') {
        try { assessmentSubmission.weaknesses = JSON.parse(assessmentSubmission.weaknesses); } catch { assessmentSubmission.weaknesses = []; }
      }
      if (typeof assessmentSubmission.recommendations === 'string') {
        try { assessmentSubmission.recommendations = JSON.parse(assessmentSubmission.recommendations); } catch { assessmentSubmission.recommendations = []; }
      }

      setSubmission(assessmentSubmission);

      if (assessmentSubmission.status === 'SUBMITTED' || assessmentSubmission.status === 'REVIEWED') {
        setCurrentView('submitted');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setRecordingDuration(duration);
  };

  const handleSubmitRecording = async () => {
    if (!audioBlob || !submission) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'assessment-recording.webm');
      formData.append('duration', recordingDuration.toString());

      const response = await fetch(apiUrl(`/api/assessments/${assessmentId}/submit`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('lisan_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to submit recording');
      }

      await loadAssessment();
      setCurrentView('submitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit recording');
    } finally {
      setSubmitting(false);
    }
  };

  const getTier = (score: number) => {
    if (score >= 90) return { label: 'Mastery / Advanced Reader', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: '🏆' };
    if (score >= 75) return { label: 'Proficient Reader', color: 'bg-[#e8f4f0] text-[#1a3a2a] border-[#2d6a4f]/30', icon: '🌿' };
    if (score >= 60) return { label: 'Developing Reader', color: 'bg-amber-50 text-amber-800 border-amber-300', icon: '📈' };
    return { label: 'Needs Targeted Support', color: 'bg-rose-50 text-rose-800 border-rose-300', icon: '🎯' };
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-12 h-12 border-4 border-[#2d6a4f]/20 border-t-[#2d6a4f] rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Preparing oral assessment…</p>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 shadow-xs">
            <div className="text-5xl mb-3">⚠️</div>
            <h2 className="text-lg font-bold text-red-900 mb-2">Could Not Load Assessment</h2>
            <p className="text-xs sm:text-sm text-red-700 mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => loadAssessment()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/student/assignments')}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
              >
                Back to Assignments
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!submission) {
    return (
      <StudentLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs">
            <div className="text-5xl mb-3">📝</div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Assessment Not Found</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              This assessment may have been archived or reassigned. Please check your assignments page.
            </p>
            <button
              onClick={() => navigate('/student/assignments')}
              className="px-6 py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1a3a2a] text-white font-bold text-xs"
            >
              Go to Assignments
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const wordCount = submission.assessment.passage.split(/\s+/).filter(Boolean).length;
  const estSeconds = Math.round((wordCount / 120) * 60);

  // ─── INSTRUCTIONS VIEW ───────────────────────────────────────────────────
  if (currentView === 'instructions') {
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1a3a2a] via-[#24523b] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/40 mb-3 tracking-wide">
              <span>🎙️</span> ORAL READING ASSESSMENT · GRADE {submission.assessment.grade.replace('GRADE_', '')}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {submission.assessment.title}
            </h1>
            {submission.assessment.description && (
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-2 leading-relaxed">
                {submission.assessment.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-emerald-200/90 mt-4 flex-wrap font-medium">
              <span>Grade {submission.assessment.grade.replace('GRADE_', '')}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>Estimated duration: ~{estSeconds} seconds</span>
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 shadow-xs space-y-5">
            <div className="p-4 bg-[#e8f4f0]/70 rounded-2xl border border-[#2d6a4f]/25">
              <h3 className="text-xs font-extrabold uppercase text-[#1a3a2a] tracking-wider mb-1 flex items-center gap-1.5">
                <span>📖</span> Administrator Instructions
              </h3>
              <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                {submission.assessment.instructions ||
                  'Please read the passage aloud clearly and naturally. Speak into your device microphone at a comfortable reading pace. When you finish, stop the recording and submit.'}
              </p>
            </div>

            {/* How It Works Steps */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">
                How It Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center mb-2">1</span>
                  <span className="block text-xs font-bold text-[#1a3a2a]">Preview Passage</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Read silently to get familiar with any tricky words.</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center mb-2">2</span>
                  <span className="block text-xs font-bold text-[#1a3a2a]">Record Aloud</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Press Record and read clearly at your natural pace.</span>
                </div>
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="w-6 h-6 rounded-full bg-[#1a3a2a] text-[#d4a017] text-xs font-black flex items-center justify-center mb-2">3</span>
                  <span className="block text-xs font-bold text-[#1a3a2a]">Admin Valuation</span>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Admin reviews your audio, calculates score /100, and gives feedback.</span>
                </div>
              </div>
            </div>

            {/* Passage Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Passage Preview
                </span>
                <span className="text-[11px] text-gray-400">
                  Read aloud during recording
                </span>
              </div>
              <InteractivePassage
                title="Reading Passage"
                text={submission.assessment.passage}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 flex-wrap">
              <button
                onClick={() => navigate('/student/assignments')}
                className="py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50"
              >
                ← Back to Assignments
              </button>

              <button
                onClick={() => setCurrentView('recording')}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white font-extrabold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <span>🎙️</span>
                <span>Start Assessment Recording →</span>
              </button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── RECORDING VIEW ──────────────────────────────────────────────────────
  if (currentView === 'recording') {
    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#2d6a4f] uppercase tracking-wider">
                Live Recording Session
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#1a3a2a]">
                {submission.assessment.title}
              </h1>
            </div>
            <button
              onClick={() => setCurrentView('instructions')}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>

          {/* Passage Display */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-extrabold uppercase text-[#1a3a2a] flex items-center gap-1.5">
                <span>📖</span> Oral Reading Passage
              </span>
              <span className="text-xs font-bold text-gray-400">
                {wordCount} words
              </span>
            </div>

            <div className="bg-[#f8faf9] rounded-2xl p-6 border border-[#2d6a4f]/20 font-serif text-base sm:text-lg text-gray-900 leading-relaxed whitespace-pre-wrap selection:bg-[#d4a017]/30">
              {submission.assessment.passage}
            </div>
          </div>

          {/* Voice Recorder Console */}
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-4">
            <AssessmentRecorder
              onComplete={handleRecordingComplete}
              onReset={() => {
                setAudioBlob(null);
                setRecordingDuration(0);
              }}
              disabled={submitting}
            />

            {audioBlob && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleSubmitRecording}
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 disabled:opacity-50 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting recording for administrator valuation…</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Submit Recording for Valuation ({formatDuration(recordingDuration)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </StudentLayout>
    );
  }

  // ─── SUBMITTED & RESULTS / VALUATION VIEW ─────────────────────────────────
  if (currentView === 'submitted') {
    const isReviewed = submission.status === 'REVIEWED';
    const tier = getTier(submission.overallScore || 0);

    return (
      <StudentLayout>
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#1a3a2a] via-[#24523b] to-[#12281d] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d4a017]/20 text-[#d4a017] border border-[#d4a017]/40 mb-3 tracking-wide">
              <span>{isReviewed ? '🏆' : '⏳'}</span>
              <span>{isReviewed ? 'OFFICIAL VALUATION COMPLETED' : 'RECORDING RECEIVED · UNDER REVIEW'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isReviewed ? 'Assessment Valuation & Results' : 'Recording Submitted Successfully'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
              {submission.assessment.title} · Grade {submission.assessment.grade.replace('GRADE_', '')}
            </p>

            {submission.submittedAt && (
              <p className="text-[11px] text-emerald-200/70 mt-3 font-medium">
                Submitted {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                {new Date(submission.submittedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Under Review Notice */}
          {!isReviewed && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 mx-auto flex items-center justify-center text-2xl">
                ⏳
              </div>
              <h3 className="text-base font-bold text-amber-950">
                Awaiting Administrator Evaluation
              </h3>
              <p className="text-xs text-amber-900 max-w-md mx-auto leading-relaxed">
                Your oral recording has been received safely. Your administrator will listen to your recording, evaluate your fluency, accuracy, and decoding skills, and provide your official score (0–100) and feedback.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  Status: Pending Valuation
                </span>
              </div>
            </div>
          )}

          {/* Audio Playback If Available */}
          {submission.audioUrl && (
            <div className="bg-white rounded-3xl border border-gray-200/90 p-5 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">
                Your Submitted Reading Recording
              </span>
              <audio controls src={submission.audioUrl} className="w-full h-10" />
            </div>
          )}

          {/* OFFICIAL VALUATION REPORT */}
          {isReviewed && (
            <div className="space-y-5">
              {/* Primary Score Hero Card */}
              <div className="bg-white rounded-3xl border border-emerald-200/80 p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-gray-100 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d4a017] block">
                      OFFICIAL ASSESSMENT SCORE
                    </span>
                    <h2 className="text-xl font-black text-[#1a3a2a]">
                      Reading Proficiency Valuation
                    </h2>
                    <p className="text-xs text-gray-500">
                      Evaluated by Lisan Administration on{' '}
                      {submission.reviewedAt ? new Date(submission.reviewedAt).toLocaleDateString() : 'recent review'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <div className="px-5 py-3 rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-[#2d6a4f] text-white text-center shadow-sm">
                      <span className="block text-3xl font-black text-[#d4a017] leading-none">
                        {submission.overallScore ?? 0}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest block mt-0.5">
                        out of 100
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border text-left ${tier.color}`}>
                      <span className="text-xl block">{tier.icon}</span>
                      <span className="text-xs font-black block mt-0.5">{tier.label}</span>
                    </div>
                  </div>
                </div>

                {/* Subskill Progress Meters */}
                <div className="mt-5 space-y-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                    Core 5 Reading Skills Breakdown
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Fluency', score: submission.fluencyScore, icon: '🎤' },
                      { label: 'Accuracy', score: submission.accuracyScore, icon: '🎯' },
                      { label: 'Phonics & Decoding', score: submission.phonicsDecodingScore, icon: '🔤' },
                      { label: 'Vocabulary', score: submission.vocabularyScore, icon: '📚' },
                      { label: 'Comprehension', score: submission.comprehensionScore, icon: '🧠' },
                    ]
                      .filter(s => s.score !== null && s.score !== undefined)
                      .map(skill => (
                        <div key={skill.label} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                            <span className="text-gray-700 flex items-center gap-1.5">
                              <span>{skill.icon}</span>
                              <span>{skill.label}</span>
                            </span>
                            <span className="text-[#1a3a2a] font-extrabold">{skill.score}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#2d6a4f] to-[#d4a017]"
                              style={{ width: `${Math.min(100, Math.max(0, skill.score || 0))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Live Reading Metrics if captured */}
                {(submission.wordsPerMinute || submission.correctWords) && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 block mb-2.5">
                      Oral Reading Metrics
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">WPM</span>
                        <span className="text-base font-black text-[#1a3a2a]">{submission.wordsPerMinute || '—'}</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">WCPM</span>
                        <span className="text-base font-black text-emerald-700">{submission.correctWordsPerMinute || '—'}</span>
                      </div>
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-400 font-bold uppercase block">Accuracy</span>
                        <span className="text-base font-black text-blue-700">{submission.accuracyScore ? `${submission.accuracyScore}%` : '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Written Feedback */}
              {submission.feedback && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                    <span>💬</span> Official Administrator Commentary & Feedback
                  </div>
                  <blockquote className="text-sm text-gray-800 leading-relaxed italic border-l-4 border-emerald-600 pl-3.5 whitespace-pre-wrap">
                    "{submission.feedback}"
                  </blockquote>
                </div>
              )}

              {/* Strengths & Growth Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submission.strengths && submission.strengths.length > 0 && (
                  <div className="bg-white rounded-3xl border border-emerald-200 p-5 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <span>✨</span> Highlights & Strengths
                    </h3>
                    <ul className="space-y-1.5">
                      {submission.strengths.map((str, i) => (
                        <li key={i} className="text-xs text-gray-800 flex items-start gap-2">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {submission.weaknesses && submission.weaknesses.length > 0 && (
                  <div className="bg-white rounded-3xl border border-amber-200 p-5 shadow-xs space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <span>🎯</span> Focus Areas for Growth
                    </h3>
                    <ul className="space-y-1.5">
                      {submission.weaknesses.map((wk, i) => (
                        <li key={i} className="text-xs text-gray-800 flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Plan & Recommendations */}
              {submission.recommendations && submission.recommendations.length > 0 && (
                <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <span>💡</span> Personalized Action Plan & Next Steps
                  </h3>
                  <div className="space-y-2">
                    {submission.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-950 font-medium">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{rec}</span>
                      </div>
                    ))}
                  </div>

                  {submission.recommendedNextLevel && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
                      <span className="font-bold text-gray-900">Recommended Next Target: </span>
                      {submission.recommendedNextLevel}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {isReviewed && (
              <Link
                to="/student/assessment-feedback"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a3a2a] to-[#2d6a4f] hover:brightness-110 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <span>📋</span>
                <span>View Full Feedback Hub & Records →</span>
              </Link>
            )}

            <button
              onClick={() => navigate('/student/assignments')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition-colors"
            >
              Back to My Assignments
            </button>

            <button
              onClick={() => navigate('/student/dashboard')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
            >
              Student Dashboard
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return null;
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}