import { MessageSquarePlus, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragPosition, setDragPosition] =
    useState<FeedbackWidgetPosition | null>(null)
  const dragMovedRef = useRef(false)
  const suppressClickRef = useRef(false)
  const activePointerIdRef = useRef<number | null>(null)
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 })

  useEffect(() => {
    setMounted(true)
  }, [])

  const finishPointer = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      const el = e.currentTarget
      if (activePointerIdRef.current === e.pointerId) {
        try {
          if (el.hasPointerCapture(e.pointerId)) {
            el.releasePointerCapture(e.pointerId)
          }
        } catch {
          // Pointer already released (e.g. lost capture).
        }
        activePointerIdRef.current = null
      }

      if (dragMovedRef.current) {
        const dx = e.clientX - startRef.current.x
        const dy = e.clientY - startRef.current.y
        setAnchor(
          clampPosition({
            left: startRef.current.left + dx,
            top: startRef.current.top + dy,
          }),
        )
        setDragPosition(null)
        setDragging(false)
        dragMovedRef.current = false
        suppressClickRef.current = true
        return
      }

      setDragging(false)
      dragMovedRef.current = false
      onClick()
    },
    [onClick, setAnchor],
  )

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) {
        return
      }

      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)

      activePointerIdRef.current = e.pointerId
      dragMovedRef.current = false
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        left: anchor.left,
        top: anchor.top,
      }
    },
    [anchor.left, anchor.top],
  )

  const onPointerMove = useCallback((e: PointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== e.pointerId) {
      return
    }

    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y

    if (!dragMovedRef.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) {
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
  }, [])

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (activePointerIdRef.current !== e.pointerId) {
        return
      }
      finishPointer(e)
    },
    [finishPointer],
  )

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (activePointerIdRef.current !== e.pointerId) {
        return
      }
      activePointerIdRef.current = null
      dragMovedRef.current = false
      setDragPosition(null)
      setDragging(false)
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {
        // ignore
      }
    },
    [],
  )

  const onButtonClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false
        e.preventDefault()
        e.stopPropagation()
      }
    },
    [],
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

  const iconStyle: CSSProperties = { pointerEvents: 'none' }

  if (!mounted) {
    return null
  }

  return createPortal(
    <button
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      type="button"
      aria-label={open ? messages.triggerClose : messages.triggerOpen}
      title={messages.triggerDragHint}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onButtonClick}
      style={style}
    >
      {open ? (
        <X size={24} strokeWidth={2.25} style={iconStyle} />
      ) : (
        <MessageSquarePlus size={24} strokeWidth={2.25} style={iconStyle} />
      )}
    </button>,
    document.body,
  )
}
