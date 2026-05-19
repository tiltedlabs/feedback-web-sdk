import { Loader2, Square } from 'lucide-react'
import { createPortal } from 'react-dom'

import { useFeedbackMessages } from '../feedback-messages-context'
import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import type { ScreenRecorderPhase } from '../hooks/use-screen-recorder'

export interface VideoRecordingStatusProps {
  readonly phase: ScreenRecorderPhase
  readonly elapsedSec: number
  readonly maxSec: number
  readonly onStop: () => void
}

export const VideoRecordingStatus = ({
  phase,
  elapsedSec,
  maxSec,
  onStop,
}: VideoRecordingStatusProps) => {
  const { messages } = useFeedbackMessages()

  if (phase === 'idle') {
    return null
  }

  return createPortal(
    <div
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      style={{
        position: 'fixed',
        right: 88,
        bottom: 26,
        zIndex: 2147483000,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 999,
        border: '1px solid #3f3f46',
        background: 'rgba(24, 24, 27, 0.96)',
        color: '#fafafa',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 13,
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {phase === 'requesting' ? (
        <>
          <Loader2
            size={16}
            strokeWidth={2.25}
            style={{ animation: 'tfb-rec-spin 1s linear infinite', flexShrink: 0 }}
          />
          <span>{messages.chooseScreenToShare}</span>
        </>
      ) : (
        <>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: '#ef4444',
              flexShrink: 0,
              boxShadow: '0 0 0 4px rgba(239,68,68,0.25)',
            }}
            aria-hidden
          />
          <span>
            {elapsedSec} s / {maxSec} s
          </span>
          <button
            type="button"
            onClick={onStop}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Square size={12} fill="currentColor" strokeWidth={0} />
            {messages.stopRecording}
          </button>
        </>
      )}
      <style>{`@keyframes tfb-rec-spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body,
  )
}
