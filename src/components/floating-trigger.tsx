import { MessageSquarePlus, X } from 'lucide-react'
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'

import { useFeedbackWidgetAnchor } from '../feedback-widget-anchor-context'
import { useFeedbackMessages } from '../feedback-messages-context'
import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import {
  clampPosition,
  getTriggerPositionStyle,
  type FeedbackWidgetPosition,
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
  const [dragPosition, setDragPosition] =
    useState<FeedbackWidgetPosition | null>(null)
  const dragMovedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 })

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) {
        return
      }

      e.preventDefault()

      const pointerId = e.pointerId
      dragMovedRef.current = false
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        left: anchor.left,
        top: anchor.top,
      }

      const onMove = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== pointerId) {
          return
        }

        const dx = ev.clientX - startRef.current.x
        const dy = ev.clientY - startRef.current.y

        if (
          !dragMovedRef.current &&
          Math.hypot(dx, dy) < DRAG_THRESHOLD_PX
        ) {
          return
        }

        dragMovedRef.current = true
        setDragging(true)
        setDragPosition(
          clampPosition({
            left: startRef.current.left + dx,
            top: startRef.current.top + dy,
          }),
        )
      }

      const finish = (ev: globalThis.PointerEvent) => {
        if (ev.pointerId !== pointerId) {
          return
        }

        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', finish)
        window.removeEventListener('pointercancel', finish)

        if (dragMovedRef.current) {
          const dx = ev.clientX - startRef.current.x
          const dy = ev.clientY - startRef.current.y
          setAnchor(
            clampPosition({
              left: startRef.current.left + dx,
              top: startRef.current.top + dy,
            }),
          )
          setDragPosition(null)
          setDragging(false)
          return
        }

        setDragging(false)
        onClick()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', finish)
      window.addEventListener('pointercancel', finish)
    },
    [anchor.left, anchor.top, onClick, setAnchor],
  )

  const displayPosition = dragPosition ?? anchor
  const positionStyle = getTriggerPositionStyle(displayPosition)

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
