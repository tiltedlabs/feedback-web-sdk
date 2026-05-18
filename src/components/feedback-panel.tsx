import { Camera, Loader2, Scan, SendHorizontal, Video } from 'lucide-react'
import { createPortal } from 'react-dom'

import {
  WEB_FEEDBACK_PRIORITIES,
  WEB_FEEDBACK_PRIORITY_STYLES,
  type WebFeedbackPriority,
} from '../priorities'
import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import { feedbackTheme } from '../styles/feedback-theme'
import type { MediaPreviewItem } from './media-preview-list'
import { MediaPreviewList } from './media-preview-list'

export interface FeedbackPanelProps {
  readonly open: boolean
  readonly description: string
  readonly onDescriptionChange: (value: string) => void
  readonly priority: WebFeedbackPriority
  readonly onPriorityChange: (value: WebFeedbackPriority) => void
  readonly mediaItems: readonly MediaPreviewItem[]
  readonly onRemoveMedia: (id: string) => void
  readonly onAnnotateMedia: (id: string) => void
  readonly onPaste: (e: React.ClipboardEvent) => void
  readonly onCaptureViewport: () => void
  readonly onStartCapture: () => void
  readonly capturingViewport?: boolean
  readonly onStartVideo: () => void
  readonly submitting: boolean
  readonly submitError: string | null
  readonly onSubmit: () => void
  readonly accentColor?: string
  readonly videoRecordingActive?: boolean
}

export const FeedbackPanel = ({
  open,
  description,
  onDescriptionChange,
  priority,
  onPriorityChange,
  mediaItems,
  onRemoveMedia,
  onAnnotateMedia,
  onPaste,
  onCaptureViewport,
  onStartCapture,
  capturingViewport = false,
  onStartVideo,
  submitting,
  submitError,
  onSubmit,
  accentColor = feedbackTheme.accent,
  videoRecordingActive = false,
}: FeedbackPanelProps) => {
  if (!open) {
    return null
  }

  return createPortal(
    <div
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      style={{
        position: 'fixed',
        right: 20,
        bottom: 88,
        zIndex: 2147483001,
        width: 420,
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'min(70vh, 640px)',
        display: 'flex',
        flexDirection: 'column',
        background: feedbackTheme.panelBg,
        border: `1px solid ${feedbackTheme.panelBorder}`,
        borderRadius: 12,
        boxShadow: '0 16px 48px rgba(0,0,0,0.45)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: feedbackTheme.text,
        overflow: 'hidden',
      }}
    >
      <div style={scrollAreaStyle} onPaste={onPaste}>
        <label style={labelStyle}>
          Description
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Décris le problème ou l’idée…"
            rows={4}
            style={textareaStyle}
          />
        </label>

        <div>
          <span style={labelStyle}>Priorité</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {WEB_FEEDBACK_PRIORITIES.map((opt) => {
              const selected = priority === opt.value
              const style = WEB_FEEDBACK_PRIORITY_STYLES[opt.value]
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onPriorityChange(opt.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: `1px solid ${selected ? style.border : '#3f3f46'}`,
                    background: selected ? style.background : 'transparent',
                    color: selected ? style.text : feedbackTheme.textMuted,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <MediaPreviewList
          items={mediaItems}
          onRemove={onRemoveMedia}
          onAnnotate={onAnnotateMedia}
        />

        {submitError ? (
          <p style={{ margin: 0, fontSize: 13, color: feedbackTheme.danger }}>{submitError}</p>
        ) : null}
      </div>

      <div style={actionsBarStyle}>
        <div style={toolsRowStyle}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1, minWidth: 0 }}>
            <button
              type="button"
              style={{
                ...toolBtn,
                opacity: capturingViewport ? 0.5 : 1,
                cursor: capturingViewport ? 'wait' : 'pointer',
              }}
              onClick={onCaptureViewport}
              disabled={capturingViewport}
            >
              <Camera size={14} strokeWidth={2} />
              {capturingViewport ? 'Capture…' : 'Capture'}
            </button>
            <button type="button" style={toolBtn} onClick={onStartCapture}>
              <Scan size={14} strokeWidth={2} />
              Zone
            </button>
            <button
              type="button"
              style={{
                ...toolBtn,
                opacity: videoRecordingActive ? 0.5 : 1,
                cursor: videoRecordingActive ? 'not-allowed' : 'pointer',
              }}
              onClick={onStartVideo}
              disabled={videoRecordingActive}
            >
              <Video size={14} strokeWidth={2} />
              {videoRecordingActive ? 'En cours…' : 'Vidéo'}
            </button>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            aria-label="Envoyer le feedback"
            style={{
              ...sendBtnStyle,
              background: accentColor,
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.75 : 1,
            }}
          >
            {submitting ? (
              <Loader2
                size={20}
                strokeWidth={2.25}
                style={{ animation: 'tfb-spin 1s linear infinite' }}
              />
            ) : (
              <SendHorizontal size={20} strokeWidth={2} />
            )}
          </button>
        </div>
        <style>{`@keyframes tfb-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>,
    document.body,
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: feedbackTheme.textMuted,
  marginBottom: 4,
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 4,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${feedbackTheme.panelBorder}`,
  background: feedbackTheme.inputBg,
  color: feedbackTheme.text,
  fontSize: 14,
  resize: 'vertical',
  boxSizing: 'border-box',
}

const scrollAreaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  padding: 14,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const actionsBarStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: '10px 14px 14px',
  borderTop: `1px solid ${feedbackTheme.panelBorder}`,
  background: feedbackTheme.panelBg,
}

const toolBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 8,
  border: `1px solid ${feedbackTheme.panelBorder}`,
  background: feedbackTheme.inputBg,
  color: feedbackTheme.text,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 500,
}

const toolsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const sendBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 20,
  border: 'none',
  color: '#fff',
  flexShrink: 0,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
}
