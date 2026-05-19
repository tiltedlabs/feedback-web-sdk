import { useCallback, useRef, useState } from 'react'

import type { FeedbackMessages } from '../i18n'
import { feedbackFileFromBlob } from '../utils/feedback-files'

export type ScreenRecorderPhase = 'idle' | 'requesting' | 'recording'

const pickMimeType = (): string | undefined => {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t))
}

export interface UseScreenRecorderResult {
  readonly phase: ScreenRecorderPhase
  readonly elapsedSec: number
  readonly maxSec: number
  readonly error: string | null
  readonly start: () => Promise<File | null>
  readonly stop: () => void
  readonly cancel: () => void
}

export const useScreenRecorder = (
  maxDurationMs: number,
  messages: FeedbackMessages,
): UseScreenRecorderResult => {
  const [phase, setPhase] = useState<ScreenRecorderPhase>('idle')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mimeTypeRef = useRef('video/webm')
  const resolveRef = useRef<((file: File | null) => void) | null>(null)
  const messagesRef = useRef(messages)

  messagesRef.current = messages

  const maxSec = Math.round(maxDurationMs / 1000)

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    recorderRef.current = null
    stopTracks()
    setElapsedSec(0)
  }, [stopTracks])

  const cancel = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null
      try {
        recorderRef.current.stop()
      } catch {
        /* ignore */
      }
    }
    cleanup()
    setPhase('idle')
    setError(null)
    resolveRef.current?.(null)
    resolveRef.current = null
  }, [cleanup])

  const stop = useCallback(() => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      cancel()
      return
    }
    recorder.stop()
  }, [cancel])

  const start = useCallback((): Promise<File | null> => {
    if (phase !== 'idle') {
      return Promise.resolve(null)
    }

    setError(null)
    setPhase('requesting')

    return new Promise<File | null>((resolve) => {
      resolveRef.current = resolve

      void (async () => {
        const m = messagesRef.current
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: 30 },
            audio: false,
          })

          if (resolveRef.current !== resolve) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }

          streamRef.current = stream
          const mimeType = pickMimeType()
          mimeTypeRef.current = mimeType ?? 'video/webm'

          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream)

          chunksRef.current = []

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunksRef.current.push(e.data)
            }
          }

          recorder.onerror = () => {
            setError(m.recordingError)
            setPhase('idle')
            cleanup()
            resolve(null)
            resolveRef.current = null
          }

          recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
            cleanup()
            setPhase('idle')

            if (blob.size < 1) {
              setError(m.noVideoData)
              resolve(null)
              resolveRef.current = null
              return
            }

            const ext = mimeTypeRef.current.includes('mp4') ? 'mp4' : 'webm'
            const file = feedbackFileFromBlob(
              blob,
              `feedback-recording-${Date.now()}.${ext}`,
              mimeTypeRef.current,
            )
            resolve(file)
            resolveRef.current = null
          }

          stream.getVideoTracks()[0]?.addEventListener('ended', () => {
            stop()
          })

          recorder.start(500)
          recorderRef.current = recorder
          setPhase('recording')

          const startedAt = Date.now()
          tickRef.current = setInterval(() => {
            setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
          }, 400)

          timerRef.current = setTimeout(() => {
            stop()
          }, maxDurationMs)
        } catch (e) {
          cleanup()
          setPhase('idle')
          const message =
            e instanceof Error
              ? e.name === 'NotAllowedError'
                ? m.screenShareDenied
                : e.message
              : m.recordingStartFailed
          setError(message)
          resolve(null)
          resolveRef.current = null
        }
      })()
    })
  }, [cleanup, maxDurationMs, phase, stop])

  return {
    phase,
    elapsedSec,
    maxSec,
    error,
    start,
    stop,
    cancel,
  }
}
