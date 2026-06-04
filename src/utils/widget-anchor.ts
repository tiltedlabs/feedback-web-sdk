import type { CSSProperties } from 'react'

export type FeedbackWidgetEdge = 'bottom' | 'top' | 'left' | 'right'

/** Position le long du bord : début (gauche / haut) ou fin (droite / bas). */
export type FeedbackWidgetAlign = 'start' | 'end'

export interface FeedbackWidgetAnchor {
  readonly edge: FeedbackWidgetEdge
  readonly align: FeedbackWidgetAlign
}

export const DEFAULT_WIDGET_ANCHOR: FeedbackWidgetAnchor = {
  edge: 'bottom',
  align: 'end',
}

const STORAGE_KEY = 'tilted-feedback-widget-anchor'

const OFFSET_PX = 20
const TRIGGER_SIZE_PX = 56
const PANEL_GAP_PX = 12

export const loadWidgetAnchor = (): FeedbackWidgetAnchor => {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDGET_ANCHOR
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return DEFAULT_WIDGET_ANCHOR
    }
    const parsed = JSON.parse(raw) as Partial<FeedbackWidgetAnchor>
    if (
      (parsed.edge === 'bottom' ||
        parsed.edge === 'top' ||
        parsed.edge === 'left' ||
        parsed.edge === 'right') &&
      (parsed.align === 'start' || parsed.align === 'end')
    ) {
      return { edge: parsed.edge, align: parsed.align }
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_WIDGET_ANCHOR
}

export const saveWidgetAnchor = (anchor: FeedbackWidgetAnchor): void => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(anchor))
  } catch {
    /* quota / mode privé */
  }
}

/** Snap le centre du widget sur le bord le plus proche. */
export const snapAnchorFromPoint = (
  clientX: number,
  clientY: number,
): FeedbackWidgetAnchor => {
  const w = window.innerWidth
  const h = window.innerHeight
  const distBottom = h - clientY
  const distTop = clientY
  const distRight = w - clientX
  const distLeft = clientX

  const min = Math.min(distBottom, distTop, distRight, distLeft)

  if (min === distBottom) {
    return { edge: 'bottom', align: clientX < w / 2 ? 'start' : 'end' }
  }
  if (min === distTop) {
    return { edge: 'top', align: clientX < w / 2 ? 'start' : 'end' }
  }
  if (min === distLeft) {
    return { edge: 'left', align: clientY < h / 2 ? 'start' : 'end' }
  }
  return { edge: 'right', align: clientY < h / 2 ? 'start' : 'end' }
}

const along = (
  anchor: FeedbackWidgetAnchor,
  startKey: 'left' | 'top',
  endKey: 'right' | 'bottom',
): Pick<CSSProperties, 'left' | 'right' | 'top' | 'bottom'> => {
  const key = anchor.align === 'start' ? startKey : endKey
  return { [key]: OFFSET_PX }
}

const offsetOn = (
  edgeKey: 'left' | 'right' | 'top' | 'bottom',
  offset: number,
): Pick<CSSProperties, 'left' | 'right' | 'top' | 'bottom'> => ({
  [edgeKey]: offset,
})

export const getTriggerPositionStyle = (
  anchor: FeedbackWidgetAnchor,
): CSSProperties => {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex: 2147483000,
  }

  switch (anchor.edge) {
    case 'bottom':
      return {
        ...base,
        ...along(anchor, 'left', 'right'),
        bottom: OFFSET_PX,
      }
    case 'top':
      return {
        ...base,
        ...along(anchor, 'left', 'right'),
        top: OFFSET_PX,
      }
    case 'left':
      return {
        ...base,
        left: OFFSET_PX,
        ...along(anchor, 'top', 'bottom'),
      }
    case 'right':
      return {
        ...base,
        right: OFFSET_PX,
        ...along(anchor, 'top', 'bottom'),
      }
  }
}

const panelOffsetFromEdge = TRIGGER_SIZE_PX + PANEL_GAP_PX

export const getPanelPositionStyle = (
  anchor: FeedbackWidgetAnchor,
): CSSProperties => {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex: 2147483001,
  }

  switch (anchor.edge) {
    case 'bottom':
      return {
        ...base,
        ...along(anchor, 'left', 'right'),
        bottom: OFFSET_PX + panelOffsetFromEdge,
        maxHeight: 'min(70vh, 640px)',
      }
    case 'top':
      return {
        ...base,
        ...along(anchor, 'left', 'right'),
        top: OFFSET_PX + panelOffsetFromEdge,
        maxHeight: 'min(70vh, 640px)',
      }
    case 'left':
      return {
        ...base,
        left: OFFSET_PX + panelOffsetFromEdge,
        ...along(anchor, 'top', 'bottom'),
        maxHeight: 'min(70vh, calc(100vh - 40px))',
      }
    case 'right':
      return {
        ...base,
        right: OFFSET_PX + panelOffsetFromEdge,
        ...along(anchor, 'top', 'bottom'),
        maxHeight: 'min(70vh, calc(100vh - 40px))',
      }
  }
}

/** Badge d’enregistrement vidéo, à côté du bouton flottant. */
export const getVideoStatusPositionStyle = (
  anchor: FeedbackWidgetAnchor,
): CSSProperties => {
  const base: CSSProperties = {
    position: 'fixed',
    zIndex: 2147483000,
  }
  const besideTrigger = OFFSET_PX + TRIGGER_SIZE_PX + 12

  switch (anchor.edge) {
    case 'bottom':
      return {
        ...base,
        ...offsetOn(
          anchor.align === 'end' ? 'right' : 'left',
          besideTrigger,
        ),
        bottom: OFFSET_PX + 6,
      }
    case 'top':
      return {
        ...base,
        ...offsetOn(
          anchor.align === 'end' ? 'right' : 'left',
          besideTrigger,
        ),
        top: OFFSET_PX + 6,
      }
    case 'left':
      return {
        ...base,
        left: besideTrigger,
        ...offsetOn(
          anchor.align === 'end' ? 'bottom' : 'top',
          OFFSET_PX + 6,
        ),
      }
    case 'right':
      return {
        ...base,
        right: besideTrigger,
        ...offsetOn(
          anchor.align === 'end' ? 'bottom' : 'top',
          OFFSET_PX + 6,
        ),
      }
  }
}
