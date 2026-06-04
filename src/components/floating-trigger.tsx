import { MessageSquarePlus, X } from 'lucide-react'
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

import { useFeedbackWidgetAnchor } from '../feedback-widget-anchor-context'
import { useFeedbackMessages } from '../feedback-messages-context'
import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import {
  getTriggerPositionStyle,
  snapAnchorFromPoint,
} from '../utils/widget-anchor'
import { feedbackTheme } from '../styles/feedback-theme'

const DRAG_THRESHOLD_PX = 8

export interface FloatingTriggerProps {
  readonly open: boolean
  readonly onClick: () => void
  readonly accentColor?: string
}

export const FloatingTrigger = ({
  open,
  onClick,
  accentColor = feedbackTheme.accent,
}: FloatingTriggerProps) => {
  const { messages } = useFeedbackMessages()
  const { anchor, setAnchor } = useFeedbackWidgetAnchor()
  const [dragging, setDragging] = useState(false)
  const dragMovedRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const startRef = useRef({ x: 0, y: 0 })

  const onPointerDown = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) {
      return
    }
    pointerIdRef.current = e.pointerId
    dragMovedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) {
      return
    }
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (!dragMovedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
      return
    }
    dragMovedRef.current = true
    setDragging(true)
  }, [])

  const finishPointer = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== e.pointerId) {
        return
      }
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* déjà relâché */
      }
      pointerIdRef.current = null

      if (dragMovedRef.current) {
        setAnchor(snapAnchorFromPoint(e.clientX, e.clientY))
        setDragging(false)
        return
      }
      setDragging(false)
      onClick()
    },
    [onClick, setAnchor],
  )

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      finishPointer(e)
    },
    [finishPointer],
  )

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== e.pointerId) {
        return
      }
      pointerIdRef.current = null
      dragMovedRef.current = false
      setDragging(false)
    },
    [],
  )

  const positionStyle = getTriggerPositionStyle(anchor)

  const style: CSSProperties = {
    ...positionStyle,
    width: 56,
    height: 56,
    borderRadius: 28,
    border: 'none',
    cursor: dragging ? 'grabbing' : 'grab',
    touchAction: 'none',
    background: accentColor,
    color: '#fff',
    boxShadow: dragging
      ? '0 12px 32px rgba(0,0,0,0.5)'
      : '0 8px 24px rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: dragging ? 'none' : 'box-shadow 0.15s ease',
  }

  return (
    <button
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      type="button"
      aria-label={open ? messages.triggerClose : messages.triggerOpen}
      title={messages.triggerDragHint}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={style}
    >
      {open ? (
        <X size={24} strokeWidth={2.25} />
      ) : (
        <MessageSquarePlus size={24} strokeWidth={2.25} />
      )}
    </button>
  )
}
