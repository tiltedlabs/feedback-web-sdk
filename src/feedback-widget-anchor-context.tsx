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
  type FeedbackWidgetAnchor,
} from './utils/widget-anchor'

interface FeedbackWidgetAnchorContextValue {
  readonly anchor: FeedbackWidgetAnchor
  readonly setAnchor: (anchor: FeedbackWidgetAnchor) => void
}

const FeedbackWidgetAnchorContext =
  createContext<FeedbackWidgetAnchorContextValue | null>(null)

export const FeedbackWidgetAnchorProvider = ({
  children,
}: {
  readonly children: ReactNode
}) => {
  const [anchor, setAnchorState] = useState<FeedbackWidgetAnchor>(() =>
    loadWidgetAnchor(),
  )

  const setAnchor = useCallback((next: FeedbackWidgetAnchor) => {
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
