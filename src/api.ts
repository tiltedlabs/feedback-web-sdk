import { MOBILE_FEEDBACK_PATH, TILTEDOS_API_BASE_URL } from './config'
import type { WebFeedbackPriority } from './priorities'

interface SubmitWebFeedbackParams {
  readonly apiKey: string
  readonly description: string
  readonly apiBaseUrl?: string
  readonly priority?: WebFeedbackPriority
  readonly title?: string
  readonly appVersion?: string
  readonly buildNumber?: string
  /** Métadonnées injectées dans la description côté serveur (user id, email, etc.). */
  readonly context?: Record<string, string>
  /** Images (captures, uploads). Envoyées dans `attachments`. */
  readonly images?: readonly File[]
  /** Première image aussi dans `screenshot` (mobile legacy). Désactivé par défaut côté web. */
  readonly mirrorFirstImageAsScreenshot?: boolean
  readonly video?: File | null
}

interface SubmitWebFeedbackResult {
  readonly task: unknown
  readonly attachment: unknown
  readonly attachments?: readonly unknown[]
}

async function parseErrorBody(res: Response, text: string): Promise<string> {
  if (!text) {
    return `HTTP ${res.status}: ${res.statusText}`
  }
  try {
    const body = JSON.parse(text) as { message?: unknown }
    if (typeof body.message === 'string') {
      return body.message
    }
    if (Array.isArray(body.message)) {
      return body.message.join(', ')
    }
  } catch {
    /* keep text */
  }
  return text
}

export async function submitWebFeedback(
  params: SubmitWebFeedbackParams,
): Promise<SubmitWebFeedbackResult> {
  const base = (params.apiBaseUrl ?? TILTEDOS_API_BASE_URL).replace(/\/$/, '')
  const url = `${base}${MOBILE_FEEDBACK_PATH}`
  const images = params.images ?? []
  const video = params.video ?? null

  if (images.length === 0 && !video) {
    throw new Error('Au moins une image ou une vidéo est requise.')
  }

  const form = new FormData()
  form.append('description', params.description)
  form.append('platform', 'web')
  if (params.priority) {
    form.append('priority', params.priority)
  }
  if (params.title?.trim()) {
    form.append('title', params.title.trim())
  }
  if (params.appVersion) {
    form.append('appVersion', params.appVersion)
  }
  if (params.buildNumber) {
    form.append('buildNumber', params.buildNumber)
  }
  if (params.context && Object.keys(params.context).length > 0) {
    form.append('context', JSON.stringify(params.context))
  }

  const mirrorScreenshot =
    params.mirrorFirstImageAsScreenshot === true && images.length > 0
  if (mirrorScreenshot) {
    form.append('screenshot', images[0], images[0].name)
  }
  for (const file of images) {
    form.append('attachments', file, file.name)
  }
  if (video) {
    form.append('video', video, video.name)
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': params.apiKey,
    },
    body: form,
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(await parseErrorBody(res, text))
  }

  return text ? (JSON.parse(text) as SubmitWebFeedbackResult) : ({} as SubmitWebFeedbackResult)
}
