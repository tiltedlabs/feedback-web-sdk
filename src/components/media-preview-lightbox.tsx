import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useFeedbackMessages } from '../feedback-messages-context'
import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import type { MediaPreviewItem } from './media-preview-list'

export interface MediaPreviewLightboxProps {
  readonly item: MediaPreviewItem | null
  readonly onClose: () => void
}

export const MediaPreviewLightbox = ({ item, onClose }: MediaPreviewLightboxProps) => {
  const { messages } = useFeedbackMessages()

  useEffect(() => {
    if (!item) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [item, onClose])

  if (!item) {
    return null
  }

  return createPortal(
    <div
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      role="dialog"
      aria-modal="true"
      aria-label={messages.mediaPreview}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'rgba(0,0,0,0.92)',
        cursor: 'zoom-out',
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label={messages.closePreview}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          borderRadius: 22,
          border: 'none',
          background: 'rgba(39, 39, 42, 0.95)',
          color: '#fafafa',
          cursor: 'pointer',
        }}
      >
        <X size={22} strokeWidth={2} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 'min(96vw, 1400px)',
          maxHeight: '92vh',
          width: '100%',
          cursor: 'default',
        }}
      >
        {item.kind === 'image' ? (
          <img
            src={item.previewUrl}
            alt={item.file.name}
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 'calc(92vh - 48px)',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
        ) : (
          <video
            src={item.previewUrl}
            controls
            autoPlay
            style={{
              display: 'block',
              maxWidth: '100%',
              maxHeight: 'calc(92vh - 48px)',
              borderRadius: 8,
              background: '#000',
            }}
          />
        )}
        <p
          style={{
            margin: '12px 0 0',
            maxWidth: '100%',
            fontSize: 13,
            color: '#a1a1aa',
            textAlign: 'center',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.file.name}
        </p>
      </div>
    </div>,
    document.body,
  )
}
