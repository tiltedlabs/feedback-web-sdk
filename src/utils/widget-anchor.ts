import type { CSSProperties } from 'react'

export interface FeedbackWidgetPosition {
  readonly left: number
  readonly top: number
}

/** @deprecated Utiliser {@link FeedbackWidgetPosition} */
export type FeedbackWidgetAnchor = FeedbackWidgetPosition

export const DEFAULT_WIDGET_ANCHOR: FeedbackWidgetPosition = {
  left: 0,
  top: 0,
}

const STORAGE_KEY = 'tilted-feedback-widget-anchor'

export const OFFSET_PX = 20
export const TRIGGER_SIZE_PX = 56
const PANEL_GAP_PX = 12
const PANEL_WIDTH_PX = 420

interface LegacyWidgetAnchor {
  readonly edge?: 'bottom' | 'top' | 'left' | 'right'
  readonly align?: 'start' | 'end'
}

const defaultPosition = (): FeedbackWidgetPosition => {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDGET_ANCHOR
  }
  return {
    left: window.innerWidth - OFFSET_PX - TRIGGER_SIZE_PX,
    top: window.innerHeight - OFFSET_PX - TRIGGER_SIZE_PX,
  }
}

const legacyToPosition = (legacy: LegacyWidgetAnchor): FeedbackWidgetPosition => {
  const w = window.innerWidth
  const h = window.innerHeight

  switch (legacy.edge) {
    case 'top':
      return {
        left:
          legacy.align === 'start'
            ? OFFSET_PX
            : w - OFFSET_PX - TRIGGER_SIZE_PX,
        top: OFFSET_PX,
      }
    case 'left':
      return {
        left: OFFSET_PX,
        top:
          legacy.align === 'start'
            ? OFFSET_PX
            : h - OFFSET_PX - TRIGGER_SIZE_PX,
      }
    case 'right':
      return {
        left: w - OFFSET_PX - TRIGGER_SIZE_PX,
        top:
          legacy.align === 'start'
            ? OFFSET_PX
            : h - OFFSET_PX - TRIGGER_SIZE_PX,
      }
    case 'bottom':
    default:
      return {
        left:
          legacy.align === 'start'
            ? OFFSET_PX
            : w - OFFSET_PX - TRIGGER_SIZE_PX,
        top: h - OFFSET_PX - TRIGGER_SIZE_PX,
      }
  }
}

export const clampPosition = (
  position: FeedbackWidgetPosition,
): FeedbackWidgetPosition => {
  if (typeof window === 'undefined') {
    return position
  }

  const maxLeft = Math.max(
    OFFSET_PX,
    window.innerWidth - TRIGGER_SIZE_PX - OFFSET_PX,
  )
  const maxTop = Math.max(
    OFFSET_PX,
    window.innerHeight - TRIGGER_SIZE_PX - OFFSET_PX,
  )

  return {
    left: Math.min(Math.max(OFFSET_PX, position.left), maxLeft),
    top: Math.min(Math.max(OFFSET_PX, position.top), maxTop),
  }
}

export const loadWidgetAnchor = (): FeedbackWidgetPosition => {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDGET_ANCHOR
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultPosition()
    }

    const parsed = JSON.parse(raw) as Partial<FeedbackWidgetPosition> &
      LegacyWidgetAnchor

    if (
      typeof parsed.left === 'number' &&
      typeof parsed.top === 'number' &&
      Number.isFinite(parsed.left) &&
      Number.isFinite(parsed.top)
    ) {
      return clampPosition({ left: parsed.left, top: parsed.top })
    }

    if (
      (parsed.edge === 'bottom' ||
        parsed.edge === 'top' ||
        parsed.edge === 'left' ||
        parsed.edge === 'right') &&
      (parsed.align === 'start' || parsed.align === 'end')
    ) {
      return clampPosition(legacyToPosition(parsed))
    }
  } catch {
    /* ignore */
  }

  return defaultPosition()
}

export const saveWidgetAnchor = (position: FeedbackWidgetPosition): void => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
  } catch {
    /* quota / mode privé */
  }
}

export const getTriggerPositionStyle = (
  position: FeedbackWidgetPosition,
): CSSProperties => ({
  position: 'fixed',
  zIndex: 2147483000,
  left: position.left,
  top: position.top,
})

export const getPanelPositionStyle = (
  position: FeedbackWidgetPosition,
): CSSProperties => {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex: 2147483001,
  }

  if (typeof window === 'undefined') {
    return base
  }

  const spaceAbove = position.top
  const spaceBelow =
    window.innerHeight - position.top - TRIGGER_SIZE_PX
  const openAbove = spaceAbove >= spaceBelow

  const maxLeft = Math.max(
    OFFSET_PX,
    window.innerWidth - PANEL_WIDTH_PX - OFFSET_PX,
  )
  const left = Math.min(Math.max(OFFSET_PX, position.left), maxLeft)

  if (openAbove) {
    return {
      ...base,
      left,
      bottom: window.innerHeight - position.top + PANEL_GAP_PX,
      maxHeight: `min(70vh, ${Math.max(120, position.top - PANEL_GAP_PX - OFFSET_PX)}px)`,
    }
  }

  return {
    ...base,
    left,
    top: position.top + TRIGGER_SIZE_PX + PANEL_GAP_PX,
    maxHeight: 'min(70vh, 640px)',
  }
}

export const getVideoStatusPositionStyle = (
  position: FeedbackWidgetPosition,
): CSSProperties => {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex: 2147483000,
    top: position.top + 6,
  }

  if (typeof window === 'undefined') {
    return base
  }

  const onRightHalf = position.left > window.innerWidth / 2

  if (onRightHalf) {
    return {
      ...base,
      right: window.innerWidth - position.left + 12,
    }
  }

  return {
    ...base,
    left: position.left + TRIGGER_SIZE_PX + 12,
  }
}
