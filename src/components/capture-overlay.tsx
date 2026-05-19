import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { useFeedbackMessages } from '../feedback-messages-context'
import {
  captureRegionAsFile,
  FEEDBACK_UI_ATTR,
  type RegionRect,
} from '../utils/capture-region'

export interface CaptureOverlayProps {
  readonly active: boolean
  readonly onCancel: () => void
  readonly onCaptured: (file: File) => void
}

export const CaptureOverlay = ({
  active,
  onCancel,
  onCaptured,
}: CaptureOverlayProps) => {
  const { messages } = useFeedbackMessages()
  const [dragging, setDragging] = useState(false)
  const [start, setStart] = useState<{ x: number; y: number } | null>(null)
  const [region, setRegion] = useState<RegionRect | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = useCallback(() => {
    setDragging(false)
    setStart(null)
    setRegion(null)
    setBusy(false)
  }, [])

  useEffect(() => {
    if (!active) {
      reset()
    }
  }, [active, reset])

  useEffect(() => {
    if (!active) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [active, onCancel])

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy) {
      return
    }
    const x = e.clientX
    const y = e.clientY
    setStart({ x, y })
    setRegion({ left: x, top: y, width: 0, height: 0 })
    setDragging(true)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !start) {
      return
    }
    const left = Math.min(start.x, e.clientX)
    const top = Math.min(start.y, e.clientY)
    const width = Math.abs(e.clientX - start.x)
    const height = Math.abs(e.clientY - start.y)
    setRegion({ left, top, width, height })
  }

  const onPointerUp = async () => {
    if (!dragging || !region || region.width < 8 || region.height < 8) {
      setDragging(false)
      return
    }
    setDragging(false)
    setBusy(true)
    try {
      const file = await captureRegionAsFile(region)
      onCaptured(file)
      reset()
    } catch (err) {
      alert(err instanceof Error ? err.message : messages.captureFailed)
      reset()
    }
  }

  if (!active) {
    return null
  }

  return createPortal(
    <div
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => void onPointerUp()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483646,
        cursor: 'crosshair',
        background: 'rgba(0,0,0,0.35)',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 16px',
          borderRadius: 8,
          background: 'rgba(24,24,27,0.95)',
          color: '#fafafa',
          fontSize: 14,
          fontFamily: 'system-ui, sans-serif',
          pointerEvents: 'none',
        }}
      >
        {busy ? messages.captureSelecting : messages.drawRegion}
      </div>
      {region && region.width > 0 && region.height > 0 ? (
        <div
          style={{
            position: 'fixed',
            left: region.left,
            top: region.top,
            width: region.width,
            height: region.height,
            border: '2px solid #8b5cf6',
            background: 'rgba(139, 92, 246, 0.12)',
            pointerEvents: 'none',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
          }}
        />
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onCancel()
        }}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1,
          padding: '8px 12px',
          borderRadius: 8,
          border: 'none',
          background: '#27272a',
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {messages.cancel}
      </button>
    </div>,
    document.body,
  )
}
