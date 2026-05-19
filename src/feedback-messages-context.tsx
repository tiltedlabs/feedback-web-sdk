import { createContext, useContext } from 'react'

import {
  DEFAULT_FEEDBACK_LOCALE,
  getFeedbackMessages,
  type FeedbackLocale,
  type FeedbackMessages,
} from './i18n'

export interface FeedbackMessagesContextValue {
  readonly locale: FeedbackLocale
  readonly messages: FeedbackMessages
}

const FeedbackMessagesContext = createContext<FeedbackMessagesContextValue>({
  locale: DEFAULT_FEEDBACK_LOCALE,
  messages: getFeedbackMessages(DEFAULT_FEEDBACK_LOCALE),
})

export const FeedbackMessagesProvider = FeedbackMessagesContext.Provider

export const useFeedbackMessages = (): FeedbackMessagesContextValue =>
  useContext(FeedbackMessagesContext)
