'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { submitWebFeedback } from './api'
import { AnnotationEditor } from './components/annotation-editor'
import { CaptureOverlay } from './components/capture-overlay'
import { FeedbackPanel } from './components/feedback-panel'
import { FloatingTrigger } from './components/floating-trigger'
import type { MediaPreviewItem } from './components/media-preview-list'
import { VideoRecordingStatus } from './components/video-recording-status'
import { FeedbackContext } from './feedback-context'
import { useScreenRecorder } from './hooks/use-screen-recorder'
import {
  DEFAULT_WEB_FEEDBACK_PRIORITY,
  type WebFeedbackPriority,
} from './priorities'
import type { AnnotationObject } from './annotation-document'
import { captureViewportAsFile } from './utils/capture-region'
import { collectClipboardImages } from './utils/feedback-files'

const DEFAULT_MAX_VIDEO_MS = 30_000
const EMPTY_ANNOTATIONS: readonly AnnotationObject[] = []

export interface TiltedOSFeedbackProviderProps {
  /** Absent ou vide → pas de widget, seuls les `children` sont rendus. */
  readonly apiKey?: string
  readonly children: React.ReactNode
  readonly accentColor?: string
  readonly maxVideoDurationMs?: number
  readonly appVersion?: string
  readonly buildNumber?: string
}

interface TiltedOSFeedbackProviderActiveProps
  extends Omit<TiltedOSFeedbackProviderProps, 'apiKey'> {
  readonly apiKey: string
}

const resolveApiKey = (apiKey: string | undefined): string => {
  if (typeof apiKey !== 'string') {
    return ''
  }

  return apiKey.trim()
}

const newMediaId = (): string =>
  `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const TiltedOSFeedbackProvider = ({
  apiKey,
  children,
  ...rest
}: TiltedOSFeedbackProviderProps) => {
  const resolvedKey = resolveApiKey(apiKey)
  if (!resolvedKey) {
    return children
  }

  return (
    <TiltedOSFeedbackProviderActive apiKey={resolvedKey} {...rest}>
      {children}
    </TiltedOSFeedbackProviderActive>
  )
}

const TiltedOSFeedbackProviderActive = ({
  apiKey,
  children,
  accentColor,
  maxVideoDurationMs = DEFAULT_MAX_VIDEO_MS,
  appVersion,
  buildNumber,
}: TiltedOSFeedbackProviderActiveProps) => {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<WebFeedbackPriority>(
    DEFAULT_WEB_FEEDBACK_PRIORITY,
  )
  const [mediaItems, setMediaItems] = useState<MediaPreviewItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [captureActive, setCaptureActive] = useState(false)
  const [capturingViewport, setCapturingViewport] = useState(false)
  const [annotateId, setAnnotateId] = useState<string | null>(null)

  const screenRecorder = useScreenRecorder(maxVideoDurationMs)

  const previewUrlsRef = useRef<Set<string>>(new Set())

  const revokeUrl = useCallback((url: string) => {
    URL.revokeObjectURL(url)
    previewUrlsRef.current.delete(url)
  }, [])

  const addMediaFile = useCallback((file: File, kind: 'image' | 'video') => {
    const previewUrl = URL.createObjectURL(file)
    previewUrlsRef.current.add(previewUrl)
    setMediaItems((prev) => [
      ...prev,
      { id: newMediaId(), file, previewUrl, kind },
    ])
  }, [])

  const saveAnnotatedMedia = useCallback(
    (id: string, file: File, annotations: readonly AnnotationObject[]) => {
      setMediaItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) {
            return item
          }
          const sourcePreviewUrl = item.sourcePreviewUrl ?? item.previewUrl
          const sourceFile = item.sourceFile ?? item.file
          if (item.previewUrl !== sourcePreviewUrl) {
            revokeUrl(item.previewUrl)
          }
          const previewUrl = URL.createObjectURL(file)
          previewUrlsRef.current.add(previewUrl)
          return {
            ...item,
            sourcePreviewUrl,
            sourceFile,
            annotations,
            file,
            previewUrl,
          }
        }),
      )
    },
    [revokeUrl],
  )

  const removeMedia = useCallback(
    (id: string) => {
      setMediaItems((prev) => {
        const target = prev.find((m) => m.id === id)
        if (target) {
          const sourcePreviewUrl = target.sourcePreviewUrl ?? target.previewUrl
          if (target.previewUrl !== sourcePreviewUrl) {
            revokeUrl(target.previewUrl)
          }
          revokeUrl(sourcePreviewUrl)
        }
        return prev.filter((m) => m.id !== id)
      })
    },
    [revokeUrl],
  )

  const addVideoFile = useCallback(
    (file: File) => {
      setMediaItems((prev) => {
        const withoutVideo = prev.filter((m) => {
          if (m.kind === 'video') {
            revokeUrl(m.previewUrl)
            return false
          }
          return true
        })
        const previewUrl = URL.createObjectURL(file)
        previewUrlsRef.current.add(previewUrl)
        return [
          ...withoutVideo,
          { id: newMediaId(), file, previewUrl, kind: 'video' },
        ]
      })
    },
    [revokeUrl],
  )

  useEffect(
    () => () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      previewUrlsRef.current.clear()
    },
    [],
  )

  useEffect(() => {
    if (screenRecorder.error) {
      setSubmitError(screenRecorder.error)
    }
  }, [screenRecorder.error])

  const resetForm = useCallback(() => {
    setDescription('')
    setPriority(DEFAULT_WEB_FEEDBACK_PRIORITY)
    setMediaItems((prev) => {
      prev.forEach((m) => revokeUrl(m.previewUrl))
      return []
    })
    setSubmitError(null)
  }, [revokeUrl])

  const onCaptureViewport = useCallback(async () => {
    if (capturingViewport) {
      return
    }
    setSubmitError(null)
    setCapturingViewport(true)
    try {
      const file = await captureViewportAsFile()
      addMediaFile(file, 'image')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') {
        return
      }
      setSubmitError(
        e instanceof Error ? e.message : 'Impossible de capturer la fenêtre',
      )
    } finally {
      setCapturingViewport(false)
    }
  }, [addMediaFile, capturingViewport])

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const images = collectClipboardImages(e.clipboardData)
      if (images.length === 0) {
        return
      }
      e.preventDefault()
      for (const file of images) {
        addMediaFile(file, 'image')
      }
    },
    [addMediaFile],
  )

  const onStartVideo = useCallback(() => {
    if (screenRecorder.phase !== 'idle') {
      return
    }
    setSubmitError(null)
    void screenRecorder.start().then((file) => {
      if (file) {
        addVideoFile(file)
      }
    })
  }, [addVideoFile, screenRecorder])

  const onSubmit = useCallback(async () => {
    const desc = description.trim()
    if (desc.length < 3) {
      setSubmitError('La description doit contenir au moins 3 caractères.')
      return
    }
    const images = mediaItems.filter((m) => m.kind === 'image').map((m) => m.file)
    const videoItem = mediaItems.find((m) => m.kind === 'video')
    if (images.length === 0 && !videoItem) {
      setSubmitError('Ajoute au moins une image ou une vidéo.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitWebFeedback({
        apiKey,
        description: desc,
        priority,
        images,
        video: videoItem?.file ?? null,
        appVersion,
        buildNumber,
      })
      resetForm()
      setOpen(false)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Impossible d'envoyer le feedback")
    } finally {
      setSubmitting(false)
    }
  }, [apiKey, appVersion, buildNumber, description, mediaItems, priority, resetForm])

  const annotateItem = mediaItems.find((m) => m.id === annotateId)
  const isRecording = screenRecorder.phase !== 'idle'

  const ctx = useMemo(() => ({ open, setOpen }), [open])

  return (
    <FeedbackContext.Provider value={ctx}>
      {children}
      <FloatingTrigger
        open={open}
        onClick={() => setOpen((v) => !v)}
        accentColor={accentColor}
      />
      <VideoRecordingStatus
        phase={screenRecorder.phase}
        elapsedSec={screenRecorder.elapsedSec}
        maxSec={screenRecorder.maxSec}
        onStop={screenRecorder.stop}
      />
      <FeedbackPanel
        open={open && screenRecorder.phase !== 'recording'}
        description={description}
        onDescriptionChange={setDescription}
        priority={priority}
        onPriorityChange={setPriority}
        mediaItems={mediaItems}
        onRemoveMedia={removeMedia}
        onAnnotateMedia={setAnnotateId}
        onPaste={onPaste}
        onCaptureViewport={() => void onCaptureViewport()}
        capturingViewport={capturingViewport}
        onStartCapture={() => setCaptureActive(true)}
        onStartVideo={onStartVideo}
        submitting={submitting}
        submitError={submitError}
        onSubmit={() => void onSubmit()}
        accentColor={accentColor}
        videoRecordingActive={isRecording}
      />
      <CaptureOverlay
        active={captureActive}
        onCancel={() => setCaptureActive(false)}
        onCaptured={(file) => {
          addMediaFile(file, 'image')
          setCaptureActive(false)
        }}
      />
      {annotateItem ? (
        <AnnotationEditor
          key={annotateItem.id}
          imageUrl={annotateItem.sourcePreviewUrl ?? annotateItem.previewUrl}
          initialObjects={annotateItem.annotations ?? EMPTY_ANNOTATIONS}
          onClose={() => setAnnotateId(null)}
          onSave={(file, annotations) => {
            if (annotateId) {
              saveAnnotatedMedia(annotateId, file, annotations)
            }
            setAnnotateId(null)
          }}
        />
      ) : null}
    </FeedbackContext.Provider>
  )
}
