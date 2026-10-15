// ─── High-Efficiency Voice Recording & Audio Compression Utility ───────────────
// Automatically selects the best available compressed audio codec (Opus/WebM, AAC/MP4)
// and forces 32–48 kbps voice bitrate with acoustic processing (echo cancellation,
// noise suppression, auto-gain) to minimize upload payload size on 2G/3G connections.

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/aac',
]

/**
 * Returns the best supported compressed audio MIME type in the current browser.
 */
export function getSupportedAudioMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm'
  }
  for (const mime of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime
    }
  }
  return ''
}

export interface OptimizedRecorderOptions {
  /** Target audio bitrate in bits per second (default: 32000 = 32 kbps voice) */
  targetBitrate?: number
}

export interface OptimizedRecorderResult {
  recorder: MediaRecorder
  mimeType: string
}

/**
 * Initializes a MediaRecorder with voice compression constraints and optimal audio bitrate.
 */
export function createOptimizedMediaRecorder(
  stream: MediaStream,
  options?: OptimizedRecorderOptions
): OptimizedRecorderResult {
  // Apply voice clarity constraints to all active audio tracks
  try {
    stream.getAudioTracks().forEach((track) => {
      const capabilities = track.getCapabilities ? track.getCapabilities() : {}
      const constraints: MediaTrackConstraints = {}
      if ('echoCancellation' in capabilities) constraints.echoCancellation = true
      if ('noiseSuppression' in capabilities) constraints.noiseSuppression = true
      if ('autoGainControl' in capabilities) constraints.autoGainControl = true
      track.applyConstraints(constraints).catch(() => {})
    })
  } catch {
    // Some older browsers ignore track constraints
  }

  const mimeType = getSupportedAudioMimeType()
  const targetBitrate = options?.targetBitrate ?? 32000 // 32 kbps voice

  const recorderOptions: MediaRecorderOptions = {
    audioBitsPerSecond: targetBitrate,
  }

  if (mimeType) {
    recorderOptions.mimeType = mimeType
  }

  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, recorderOptions)
  } catch (err) {
    console.warn('[AudioRecorder] Failed with options, falling back to default:', err)
    recorder = new MediaRecorder(stream)
  }

  return {
    recorder,
    mimeType: recorder.mimeType || mimeType || 'audio/webm',
  }
}

/**
 * Combines recorded chunks into a compressed Blob with the matching MIME type.
 */
export function createCompressedAudioBlob(
  chunks: BlobPart[],
  mimeType?: string
): Blob {
  const finalMime = mimeType || getSupportedAudioMimeType() || 'audio/webm'
  return new Blob(chunks, { type: finalMime })
}
