export const FEEDBACK_UI_ATTR = 'data-tiltedos-feedback-ui'

export interface RegionRect {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

const waitFrames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    let remaining = count
    const tick = () => {
      remaining -= 1
      if (remaining <= 0) {
        resolve()
        return
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

const cropCanvas = (
  source: HTMLCanvasElement,
  region: RegionRect,
  scaleX: number,
  scaleY: number,
): HTMLCanvasElement => {
  const sx = Math.max(0, Math.round(region.left * scaleX))
  const sy = Math.max(0, Math.round(region.top * scaleY))
  const sw = Math.max(1, Math.min(Math.round(region.width * scaleX), source.width - sx))
  const sh = Math.max(1, Math.min(Math.round(region.height * scaleY), source.height - sy))

  const canvas = document.createElement('canvas')
  canvas.width = sw
  canvas.height = sh
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D indisponible')
  }
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh)
  return canvas
}

const captureDisplayFrame = async (): Promise<HTMLCanvasElement> => {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: 'browser',
    },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
  } as DisplayMediaStreamOptions)

  const video = document.createElement('video')
  video.srcObject = stream
  video.muted = true
  await video.play()
  await waitFrames(3)

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    stream.getTracks().forEach((t) => t.stop())
    throw new Error('Canvas 2D indisponible')
  }
  ctx.drawImage(video, 0, 0)
  stream.getTracks().forEach((t) => t.stop())
  return canvas
}

/** Masque l’UI feedback le temps de la capture (overlay inclus). */
export const withFeedbackUiHidden = async <T>(fn: () => Promise<T>): Promise<T> => {
  const hidden: { el: HTMLElement; visibility: string }[] = []
  document.querySelectorAll(`[${FEEDBACK_UI_ATTR}]`).forEach((node) => {
    const el = node as HTMLElement
    hidden.push({ el, visibility: el.style.visibility })
    el.style.visibility = 'hidden'
  })
  await waitFrames(2)
  try {
    return await fn()
  } finally {
    hidden.forEach(({ el, visibility }) => {
      el.style.visibility = visibility
    })
  }
}

/**
 * Capture pixel-perfect via partage d’écran (ce que tu vois à l’écran),
 * puis recadre la zone sélectionnée (coordonnées viewport).
 */
const frameToPngFile = async (canvas: HTMLCanvasElement, prefix: string): Promise<File> => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          reject(new Error('Échec de la capture'))
          return
        }
        resolve(b)
      },
      'image/png',
      0.92,
    )
  })
  return new File([blob], `${prefix}-${Date.now()}.png`, { type: 'image/png' })
}

const viewportRegion = (): RegionRect => ({
  left: 0,
  top: 0,
  width: window.innerWidth,
  height: window.innerHeight,
})

/** Capture complète de la fenêtre visible (viewport), sans l’UI feedback. */
export const captureViewportAsFile = async (): Promise<File> =>
  withFeedbackUiHidden(async () => {
    await waitFrames(2)
    const frame = await captureDisplayFrame()
    const scaleX = frame.width / window.innerWidth
    const scaleY = frame.height / window.innerHeight
    const cropped = cropCanvas(frame, viewportRegion(), scaleX, scaleY)
    return frameToPngFile(cropped, 'capture')
  })

export const captureRegionAsFile = async (
  region: RegionRect,
): Promise<File> =>
  withFeedbackUiHidden(async () => {
    await waitFrames(2)
    const frame = await captureDisplayFrame()
    const scaleX = frame.width / window.innerWidth
    const scaleY = frame.height / window.innerHeight
    const cropped = cropCanvas(frame, region, scaleX, scaleY)
    return frameToPngFile(cropped, 'zone')
  })
