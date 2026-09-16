import { useState, useRef, useEffect } from 'react'
import { useLang } from '../../contexts/LangContext'

// ─── Minimal SpeechRecognition type shim ─────────────────────────────────────
interface ISpeechRecognitionEvent {
  resultIndex: number
  results: { isFinal: boolean; [i: number]: { transcript: string } }[]
}

interface ISpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: ISpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

type SpeechRecCtor = new () => ISpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecCtor
    webkitSpeechRecognition?: SpeechRecCtor
  }
}

interface Props {
  onTranscript?: (text: string) => void
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void
  disabled?: boolean
}

type State = 'idle' | 'recording' | 'processing' | 'done' | 'error'

export default function VoiceRecorder({ onTranscript, onRecordingComplete, disabled = false }: Props) {
  const { t } = useLang()
  const [state, setState] = useState<State>('idle')
  const [seconds, setSeconds] = useState(0)
  const [transcript, setTranscript] = useState('')
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Use browser SpeechRecognition if available (live transcript, no server needed)
  const SpeechRec: SpeechRecCtor | undefined = window.SpeechRecognition || window.webkitSpeechRecognition

  const recogRef = useRef<ISpeechRecognition | null>(null)

  // Cleanup on unmount
  useEffect(() => () => {
    timerRef.current && clearInterval(timerRef.current)
    recogRef.current?.abort()
    mediaRecRef.current?.stop()
  }, [])

  const startRecording = async () => {
    if (disabled) return
    setTranscript('')
    setSeconds(0)
    chunksRef.current = []

    // Try browser SpeechRecognition first (works offline, no API key)
    if (SpeechRec) {
      const rec = new SpeechRec()
      rec.lang = 'en-US'
      rec.continuous = false
      rec.interimResults = true
      recogRef.current = rec

      let finalText = ''
      rec.onresult = (e) => {
        let interim = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript
          if (e.results[i].isFinal) finalText += txt + ' '
          else interim = txt
        }
        setTranscript(finalText || interim)
      }
      rec.onerror = () => {
        setState('error')
        clearInterval(timerRef.current!)
      }
      rec.onend = () => {
        clearInterval(timerRef.current!)
        const result = finalText.trim() || transcript.trim()
        if (result) {
          setTranscript(result)
          setState('done')
          onTranscript?.(result)
        } else {
          setState('idle')
        }
      }
      rec.start()
      setState('recording')
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
      return
    }

    // Fallback: MediaRecorder (records audio, no live transcript available on this device)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecRef.current = mr
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach(track => track.stop())
        // SpeechRecognition is not available on this device.
        // Audio is recorded and can be uploaded, but no automatic transcription is possible here.
        // Show a clear message rather than generating a fake answer.
        setState('done')
        setTranscript('')
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        onRecordingComplete?.(blob, seconds)
      }
      mr.start()
      setState('recording')
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      setState('error')
    }
  }

  const stopRecording = () => {
    timerRef.current && clearInterval(timerRef.current)
    if (recogRef.current) {
      recogRef.current.stop()
    } else if (mediaRecRef.current?.state === 'recording') {
      mediaRecRef.current.stop()
      setState('processing')
    }
  }

  const reset = () => {
    setTranscript('')
    setState('idle')
    setSeconds(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-2">
      {/* Main mic button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={state === 'recording' ? stopRecording : startRecording}
          disabled={disabled || state === 'processing'}
          className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            state === 'recording'
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
              : state === 'done'
              ? 'bg-success-100 text-success-700 border border-success-300'
              : state === 'error'
              ? 'bg-danger-50 text-danger-600 border border-danger-200'
              : 'bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100'
          } disabled:opacity-50`}
        >
          {state === 'recording' && (
            <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-30" />
          )}

          {state === 'idle'       && <span className="text-base">🎙</span>}
          {state === 'recording'  && <span className="text-base">⏹</span>}
          {state === 'processing' && (
            <span className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          )}
          {state === 'done'       && <span className="text-base">✅</span>}
          {state === 'error'      && <span className="text-base">⚠️</span>}

          <span>
            {state === 'idle'       && t.speakAnswer}
            {state === 'recording'  && `${t.recording} ${fmt(seconds)}`}
            {state === 'processing' && 'Processing…'}
            {state === 'done'       && (transcript ? 'Recorded' : 'Recorded — type your answer below')}
            {state === 'error'      && 'Mic unavailable'}
          </span>
        </button>

        {state === 'done' && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Redo
          </button>
        )}
      </div>

      {/* Live transcript bubble */}
      {(state === 'recording' || state === 'done') && transcript && (
        <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 italic">
          "{transcript}"
        </div>
      )}

      {state === 'idle' && (
        <p className="text-xs text-gray-400">{t.recordingTip}</p>
      )}
      {state === 'done' && !transcript && (
        <p className="text-xs text-amber-600">Transcription is not available on this device. Please type your answer below.</p>
      )}
    </div>
  )
}
