import { createContext, useContext } from 'react'

export interface FeedbackContextValue {
  readonly open: boolean
  readonly setOpen: (open: boolean) => void
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null)

export const useTiltedOSFeedback = (): FeedbackContextValue => {
  const ctx = useContext(FeedbackContext)
  if (!ctx) {
    throw new Error('useTiltedOSFeedback must be used within TiltedOSFeedbackProvider')
  }
  return ctx
}
