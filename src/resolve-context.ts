export type FeedbackContextInput =
  | Record<string, string | undefined>
  | (() => Record<string, string | undefined>)

export function resolveFeedbackContext(
  input?: FeedbackContextInput,
): Record<string, string> | undefined {
  if (!input) {
    return undefined
  }

  const raw = typeof input === 'function' ? input() : input
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(raw)) {
    const label = key.trim()
    if (!label || value === undefined) {
      continue
    }
    const normalized = String(value).trim()
    if (normalized) {
      result[label] = normalized
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}
