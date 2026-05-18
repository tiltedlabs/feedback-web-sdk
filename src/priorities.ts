export type WebFeedbackPriority = 'low' | 'medium' | 'high' | 'critical'

export const WEB_FEEDBACK_PRIORITY_STYLES: Record<
  WebFeedbackPriority,
  {
    readonly text: string
    readonly border: string
    readonly background: string
  }
> = {
  low: {
    text: '#a1a1aa',
    border: '#a1a1aa',
    background: 'rgba(161, 161, 170, 0.2)',
  },
  medium: {
    text: '#60a5fa',
    border: '#60a5fa',
    background: 'rgba(96, 165, 250, 0.2)',
  },
  high: {
    text: '#fbbf24',
    border: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.2)',
  },
  critical: {
    text: '#f87171',
    border: '#f87171',
    background: 'rgba(248, 113, 113, 0.2)',
  },
}

export const WEB_FEEDBACK_PRIORITIES: readonly {
  readonly value: WebFeedbackPriority
  readonly label: string
}[] = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Normale' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
] as const

export const DEFAULT_WEB_FEEDBACK_PRIORITY: WebFeedbackPriority = 'medium'
