'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  DEFAULT_WIDGET_ANCHOR,
  loadWidgetAnchor,
  saveWidgetAnchor,
  type FeedbackWidgetPosition,
} from './utils/widget-anchor'

interface FeedbackWidgetAnchorContextValue {
  readonly anchor: FeedbackWidgetPosition
  readonly setAnchor: (anchor: FeedbackWidgetPosition) => void
}

const FeedbackWidgetAnchorContext =
  createContext<FeedbackWidgetAnchorContextValue | null>(null)

export const FeedbackWidgetAnchorProvider = ({
  children,
}: {
  readonly children: ReactNode
}) => {
  const [anchor, setAnchorState] = useState<FeedbackWidgetPosition>(() =>
    loadWidgetAnchor(),
  )

  const setAnchor = useCallback((next: FeedbackWidgetPosition) => {
    setAnchorState(next)
    saveWidgetAnchor(next)
  }, [])

  const value = useMemo(
    () => ({ anchor, setAnchor }),
    [anchor, setAnchor],
  )

  return (
    <FeedbackWidgetAnchorContext.Provider value={value}>
      {children}
    </FeedbackWidgetAnchorContext.Provider>
  )
}

export const useFeedbackWidgetAnchor = (): FeedbackWidgetAnchorContextValue => {
  const ctx = useContext(FeedbackWidgetAnchorContext)
  if (!ctx) {
    return {
      anchor: DEFAULT_WIDGET_ANCHOR,
      setAnchor: () => {},
    }
  }
  return ctx
}
