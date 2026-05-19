import { LineSquiggle, MousePointer2, Square, Trash2, Type, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import {
  cloneAnnotationObjects,
  type AnnotationColor,
  type AnnotationObject,
  type AnnotationPoint,
} from '../annotation-document'
import { useFeedbackMessages } from '../feedback-messages-context'
import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import { feedbackFileFromBlob } from '../utils/feedback-files'

export type { AnnotationColor, AnnotationObject } from '../annotation-document'

export interface AnnotationEditorProps {
  readonly imageUrl: string
  readonly initialObjects?: readonly AnnotationObject[]
  readonly onClose: () => void
  readonly onSave: (file: File, objects: readonly AnnotationObject[]) => void
}

type AnnotationTool = 'pen' | 'rectangle' | 'text' | 'select'

type Point = AnnotationPoint

interface Bounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

type RectAnnotation = Extract<AnnotationObject, { type: 'rectangle' }>
type TextAnnotation = Extract<AnnotationObject, { type: 'text' }>
type PenStrokeAnnotation = Extract<AnnotationObject, { type: 'pen' }>

interface TextPlacement {
  readonly canvasX: number
  readonly canvasY: number
  readonly screenX: number
  readonly screenY: number
  readonly value: string
  readonly color: AnnotationColor
}

interface DragState {
  readonly id: string
  readonly offsetX: number
  readonly offsetY: number
}

const DEFAULT_COLOR: AnnotationColor = '#ef4444'
const SELECTION_COLOR = '#8b5cf6'
const MIN_RECT_SIZE = 4

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const getLineWidth = (canvas: HTMLCanvasElement) =>
  Math.max(3, canvas.width / 400)

const getFontSize = (canvas: HTMLCanvasElement) =>
  Math.max(18, Math.round(canvas.width / 36))

const applyTextFont = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const fontSize = getFontSize(canvas)
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.textBaseline = 'top'
}

const getTextBounds = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  obj: TextAnnotation,
): Bounds => {
  applyTextFont(ctx, canvas)
  const metrics = ctx.measureText(obj.text)
  const pad = 4
  return {
    x: obj.x - pad,
    y: obj.y - pad,
    width: metrics.width + pad * 2,
    height: getFontSize(canvas) + pad * 2,
  }
}

const getPenBounds = (stroke: PenStrokeAnnotation): Bounds | null => {
  if (stroke.points.length === 0) {
    return null
  }
  let minX = stroke.points[0]!.x
  let minY = stroke.points[0]!.y
  let maxX = minX
  let maxY = minY
  for (const p of stroke.points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  const pad = 8
  return {
    x: minX - pad,
    y: minY - pad,
    width: Math.max(maxX - minX, 1) + pad * 2,
    height: Math.max(maxY - minY, 1) + pad * 2,
  }
}

const getObjectBounds = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  obj: AnnotationObject,
): Bounds | null => {
  if (obj.type === 'rectangle') {
    return { x: obj.x, y: obj.y, width: obj.width, height: obj.height }
  }
  if (obj.type === 'text') {
    return getTextBounds(ctx, canvas, obj)
  }
  return getPenBounds(obj)
}

const pointInBounds = (point: Point, bounds: Bounds, pad = 6): boolean =>
  point.x >= bounds.x - pad &&
  point.x <= bounds.x + bounds.width + pad &&
  point.y >= bounds.y - pad &&
  point.y <= bounds.y + bounds.height + pad

const distanceToSegment = (p: Point, a: Point, b: Point): number => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y)
  }
  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)),
  )
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

const hitTestPenStroke = (
  stroke: PenStrokeAnnotation,
  point: Point,
  threshold: number,
): boolean => {
  if (stroke.points.length === 0) {
    return false
  }
  if (stroke.points.length === 1) {
    return Math.hypot(point.x - stroke.points[0]!.x, point.y - stroke.points[0]!.y) <= threshold
  }
  for (let i = 1; i < stroke.points.length; i += 1) {
    if (distanceToSegment(point, stroke.points[i - 1]!, stroke.points[i]!) <= threshold) {
      return true
    }
  }
  return false
}

const hitTestObject = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  objects: readonly AnnotationObject[],
  point: Point,
): string | null => {
  const threshold = getLineWidth(canvas) * 2
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const obj = objects[i]!
    if (obj.type === 'pen') {
      if (hitTestPenStroke(obj, point, threshold)) {
        return obj.id
      }
      continue
    }
    const bounds = getObjectBounds(ctx, canvas, obj)
    if (bounds && pointInBounds(point, bounds)) {
      return obj.id
    }
  }
  return null
}

const drawPenStroke = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stroke: PenStrokeAnnotation,
) => {
  if (stroke.points.length < 2) {
    return
  }
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = getLineWidth(canvas)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y)
  for (let i = 1; i < stroke.points.length; i += 1) {
    ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y)
  }
  ctx.stroke()
}

const redrawPenLayer = (
  penCanvas: HTMLCanvasElement,
  displayCanvas: HTMLCanvasElement,
  strokes: readonly PenStrokeAnnotation[],
  draftStroke: PenStrokeAnnotation | null,
) => {
  const ctx = penCanvas.getContext('2d')
  if (!ctx) {
    return
  }
  ctx.clearRect(0, 0, penCanvas.width, penCanvas.height)
  for (const stroke of strokes) {
    drawPenStroke(ctx, displayCanvas, stroke)
  }
  if (draftStroke) {
    drawPenStroke(ctx, displayCanvas, draftStroke)
  }
}

const drawRectangle = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bounds: Bounds,
  color: AnnotationColor,
) => {
  ctx.strokeStyle = color
  ctx.lineWidth = getLineWidth(canvas)
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
}

const drawText = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  obj: TextAnnotation,
) => {
  applyTextFont(ctx, canvas)
  ctx.fillStyle = obj.color
  ctx.fillText(obj.text, obj.x, obj.y)
}

const drawSelection = (ctx: CanvasRenderingContext2D, bounds: Bounds) => {
  ctx.save()
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.strokeRect(bounds.x - 4, bounds.y - 4, bounds.width + 8, bounds.height + 8)
  ctx.restore()
}

const boundsFromPoints = (from: Point, to: Point): Bounds => ({
  x: Math.min(from.x, to.x),
  y: Math.min(from.y, to.y),
  width: Math.abs(to.x - from.x),
  height: Math.abs(to.y - from.y),
})

const placeholderAlpha = (color: AnnotationColor) => {
  if (color === '#ffffff') {
    return 'rgba(255, 255, 255, 0.55)'
  }
  if (color === '#000000') {
    return 'rgba(0, 0, 0, 0.55)'
  }
  return 'rgba(239, 68, 68, 0.55)'
}

export const AnnotationEditor = ({
  imageUrl,
  initialObjects = [],
  onClose,
  onSave,
}: AnnotationEditorProps) => {
  const { messages } = useFeedbackMessages()
  const annotationColors: readonly {
    readonly value: AnnotationColor
    readonly label: string
  }[] = [
    { value: '#000000', label: messages.colorBlack },
    { value: '#ffffff', label: messages.colorWhite },
    { value: '#ef4444', label: messages.colorRed },
  ]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const penCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const startPointRef = useRef<Point | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const [tool, setTool] = useState<AnnotationTool>('pen')
  const [activeColor, setActiveColor] = useState<AnnotationColor>(DEFAULT_COLOR)
  const [drawing, setDrawing] = useState(false)
  const [objects, setObjects] = useState<AnnotationObject[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftRect, setDraftRect] = useState<Bounds | null>(null)
  const [draftPen, setDraftPen] = useState<PenStrokeAnnotation | null>(null)
  const [textPlacement, setTextPlacement] = useState<TextPlacement | null>(null)
  const textPlacementRef = useRef<TextPlacement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const objectsRef = useRef(objects)
  const selectedIdRef = useRef(selectedId)
  const activeColorRef = useRef(activeColor)
  const draftPenRef = useRef(draftPen)

  useEffect(() => {
    textPlacementRef.current = textPlacement
  }, [textPlacement])

  useEffect(() => {
    objectsRef.current = objects
  }, [objects])

  useEffect(() => {
    selectedIdRef.current = selectedId
  }, [selectedId])

  useEffect(() => {
    activeColorRef.current = activeColor
  }, [activeColor])

  useEffect(() => {
    draftPenRef.current = draftPen
  }, [draftPen])

  const composite = useCallback(
    (
      nextObjects: readonly AnnotationObject[],
      nextSelectedId: string | null,
      nextDraftRect: Bounds | null,
      nextDraftRectColor: AnnotationColor,
    ) => {
      const canvas = canvasRef.current
      const img = imageRef.current
      const penCanvas = penCanvasRef.current
      if (!canvas || !img || !penCanvas) {
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const penStrokes = nextObjects.filter((o): o is PenStrokeAnnotation => o.type === 'pen')
      redrawPenLayer(penCanvas, canvas, penStrokes, draftPenRef.current)

      ctx.drawImage(img, 0, 0)
      ctx.drawImage(penCanvas, 0, 0)

      for (const obj of nextObjects) {
        if (obj.type === 'rectangle') {
          drawRectangle(ctx, canvas, obj, obj.color)
        } else if (obj.type === 'text') {
          drawText(ctx, canvas, obj)
        }
        if (obj.id === nextSelectedId && obj.type !== 'pen') {
          const bounds = getObjectBounds(ctx, canvas, obj)
          if (bounds) {
            drawSelection(ctx, bounds)
          }
        }
      }

      if (nextSelectedId) {
        const selected = nextObjects.find((o) => o.id === nextSelectedId)
        if (selected?.type === 'pen') {
          const bounds = getPenBounds(selected)
          if (bounds) {
            drawSelection(ctx, bounds)
          }
        }
      }

      if (nextDraftRect && nextDraftRect.width > 0 && nextDraftRect.height > 0) {
        drawRectangle(ctx, canvas, nextDraftRect, nextDraftRectColor)
      }
    },
    [],
  )

  const redraw = useCallback(() => {
    composite(
      objectsRef.current,
      selectedIdRef.current,
      draftRect,
      activeColorRef.current,
    )
  }, [composite, draftRect])

  useEffect(() => {
    redraw()
  }, [objects, selectedId, draftRect, draftPen, activeColor, redraw])

  useEffect(() => {
    setTool('pen')
    setActiveColor(DEFAULT_COLOR)
    activeColorRef.current = DEFAULT_COLOR
    setTextPlacement(null)
    textPlacementRef.current = null
    const restored = cloneAnnotationObjects(initialObjects)
    setObjects(restored)
    objectsRef.current = restored
    setSelectedId(null)
    selectedIdRef.current = null
    setDraftRect(null)
    setDraftPen(null)
    draftPenRef.current = null
    setDrawing(false)
    startPointRef.current = null
    dragStateRef.current = null
    penCanvasRef.current = null

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const penCanvas = document.createElement('canvas')
      penCanvas.width = img.naturalWidth
      penCanvas.height = img.naturalHeight
      penCanvasRef.current = penCanvas
      composite(restored, null, null, DEFAULT_COLOR)
    }
    img.src = imageUrl
  }, [imageUrl, initialObjects, composite])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedIdRef.current &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault()
        const id = selectedIdRef.current
        setObjects((prev) => {
          const next = prev.filter((o) => o.id !== id)
          objectsRef.current = next
          return next
        })
        setSelectedId(null)
        selectedIdRef.current = null
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const getPoint = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const applyColor = useCallback((color: AnnotationColor) => {
    setActiveColor(color)
    activeColorRef.current = color
    const id = selectedIdRef.current
    if (!id) {
      return
    }
    setObjects((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, color } : item))
      objectsRef.current = next
      return next
    })
  }, [])

  const deleteSelected = () => {
    const id = selectedIdRef.current
    if (!id) {
      return
    }
    setObjects((prev) => {
      const next = prev.filter((o) => o.id !== id)
      objectsRef.current = next
      return next
    })
    setSelectedId(null)
    selectedIdRef.current = null
  }

  const flushPendingText = useCallback(() => {
    const placement = textPlacementRef.current
    if (!placement) {
      return
    }
    const trimmed = placement.value.trim()
    setTextPlacement(null)
    textPlacementRef.current = null
    if (!trimmed) {
      return
    }
    const id = newId()
    const newObj: TextAnnotation = {
      id,
      type: 'text',
      x: placement.canvasX,
      y: placement.canvasY,
      text: trimmed,
      color: placement.color,
    }
    setObjects((prev) => {
      const next = [...prev, newObj]
      objectsRef.current = next
      return next
    })
    setSelectedId(id)
    selectedIdRef.current = id
    setActiveColor(placement.color)
    activeColorRef.current = placement.color
    setTool('select')
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (textPlacementRef.current) {
      flushPendingText()
    }
    const canvas = canvasRef.current
    const penCanvas = penCanvasRef.current
    if (!canvas || !penCanvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const point = getPoint(e)

    if (tool === 'select') {
      const hitId = hitTestObject(ctx, canvas, objectsRef.current, point)
      if (hitId) {
        const obj = objectsRef.current.find((o) => o.id === hitId)!
        const bounds = getObjectBounds(ctx, canvas, obj)
        if (!bounds) {
          return
        }
        setSelectedId(hitId)
        selectedIdRef.current = hitId
        setActiveColor(obj.color)
        activeColorRef.current = obj.color
        dragStateRef.current = {
          id: hitId,
          offsetX: point.x - bounds.x,
          offsetY: point.y - bounds.y,
        }
        e.currentTarget.setPointerCapture(e.pointerId)
      } else {
        setSelectedId(null)
        selectedIdRef.current = null
      }
      return
    }

    setSelectedId(null)
    selectedIdRef.current = null

    if (tool === 'text') {
      e.preventDefault()
      setTextPlacement({
        canvasX: point.x,
        canvasY: point.y,
        screenX: e.clientX,
        screenY: e.clientY,
        value: '',
        color: activeColorRef.current,
      })
      return
    }

    if (tool === 'rectangle') {
      startPointRef.current = point
      setDraftRect({ x: point.x, y: point.y, width: 0, height: 0 })
      setDrawing(true)
      return
    }

    const stroke: PenStrokeAnnotation = {
      id: newId(),
      type: 'pen',
      color: activeColorRef.current,
      points: [point],
    }
    setDraftPen(stroke)
    draftPenRef.current = stroke
    setDrawing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const penCanvas = penCanvasRef.current
    if (!canvas || !penCanvas) {
      return
    }

    const point = getPoint(e)
    const drag = dragStateRef.current

    if (tool === 'select' && drag) {
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }
      const obj = objectsRef.current.find((o) => o.id === drag.id)
      if (!obj) {
        return
      }
      const bounds = getObjectBounds(ctx, canvas, obj)
      if (!bounds) {
        return
      }
      const nextX = point.x - drag.offsetX
      const nextY = point.y - drag.offsetY
      setObjects((prev) =>
        prev.map((item) => {
          if (item.id !== drag.id) {
            return item
          }
          if (item.type === 'pen') {
            const dx = nextX - bounds.x
            const dy = nextY - bounds.y
            return {
              ...item,
              points: item.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            }
          }
          return { ...item, x: nextX, y: nextY }
        }),
      )
      return
    }

    if (!drawing) {
      return
    }

    const start = startPointRef.current

    if (tool === 'rectangle' && start) {
      setDraftRect(boundsFromPoints(start, point))
      return
    }

    if (tool === 'pen' && draftPenRef.current) {
      const nextStroke: PenStrokeAnnotation = {
        ...draftPenRef.current,
        points: [...draftPenRef.current.points, point],
      }
      setDraftPen(nextStroke)
      draftPenRef.current = nextStroke
      composite(
        objectsRef.current,
        selectedIdRef.current,
        draftRect,
        activeColorRef.current,
      )
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (dragStateRef.current) {
      dragStateRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* déjà relâché */
      }
    }

    if (!drawing) {
      return
    }

    const start = startPointRef.current
    if (tool === 'rectangle' && start) {
      const canvas = canvasRef.current
      if (canvas) {
        const end = getPoint(e)
        const bounds = boundsFromPoints(start, end)
        if (bounds.width >= MIN_RECT_SIZE && bounds.height >= MIN_RECT_SIZE) {
          const id = newId()
          const newObj: RectAnnotation = {
            id,
            type: 'rectangle',
            ...bounds,
            color: activeColorRef.current,
          }
          setObjects((prev) => {
            const next = [...prev, newObj]
            objectsRef.current = next
            return next
          })
          setSelectedId(id)
          selectedIdRef.current = id
          setTool('select')
        }
      }
      setDraftRect(null)
    }

    if (tool === 'pen' && draftPenRef.current) {
      if (draftPenRef.current.points.length >= 2) {
        const committed = draftPenRef.current
        setObjects((prev) => {
          const next = [...prev, committed]
          objectsRef.current = next
          return next
        })
        setSelectedId(committed.id)
        selectedIdRef.current = committed.id
        setTool('select')
      }
      setDraftPen(null)
      draftPenRef.current = null
    }

    setDrawing(false)
    startPointRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* déjà relâché */
    }
  }

  const handleSave = useCallback(() => {
    flushPendingText()
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    composite(objectsRef.current, null, null, activeColorRef.current)
    const savedObjects = cloneAnnotationObjects(objectsRef.current)
    canvas.toBlob((blob) => {
      if (!blob) {
        return
      }
      onSave(
        feedbackFileFromBlob(blob, `annotated-${Date.now()}.png`, 'image/png'),
        savedObjects,
      )
      onClose()
    }, 'image/png', 0.92)
  }, [composite, flushPendingText, onClose, onSave])

  const handleClose = () => {
    setTextPlacement(null)
    textPlacementRef.current = null
    onClose()
  }

  const switchTool = (next: AnnotationTool) => {
    setDrawing(false)
    setDraftRect(null)
    setDraftPen(null)
    draftPenRef.current = null
    startPointRef.current = null
    dragStateRef.current = null
    setTextPlacement(null)
    textPlacementRef.current = null
    setTool(next)
  }

  const cursor =
    tool === 'text'
      ? 'text'
      : tool === 'select'
        ? selectedId
          ? 'move'
          : 'default'
        : 'crosshair'

  const inputColor = textPlacement?.color ?? activeColor

  return createPortal(
    <div
      {...{ [FEEDBACK_UI_ATTR]: '' }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <button
        type="button"
        onClick={handleClose}
        aria-label={messages.close}
        style={closeBtnStyle}
      >
        <X size={22} strokeWidth={2} />
      </button>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '56px 16px 8px',
          minHeight: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={(e) => {
            if (dragStateRef.current) {
              onPointerUp(e)
            } else if (drawing) {
              onPointerUp(e)
            }
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: 8,
            cursor,
            touchAction: 'none',
          }}
        />
      </div>


      {textPlacement ? (
        <input
          type="text"
          data-tfb-annotation-text
          autoFocus
          value={textPlacement.value}
          placeholder={messages.textPlaceholder}
          onChange={(e) => {
            const next = { ...textPlacement, value: e.target.value }
            textPlacementRef.current = next
            setTextPlacement(next)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              flushPendingText()
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              setTextPlacement(null)
              textPlacementRef.current = null
            }
          }}
          onBlur={flushPendingText}
          style={{
            position: 'fixed',
            left: textPlacement.screenX,
            top: textPlacement.screenY,
            zIndex: 2147483648,
            minWidth: 160,
            maxWidth: 'min(320px, 90vw)',
            padding: '4px 8px',
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: inputColor,
            caretColor: inputColor,
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
      ) : null}

      {textPlacement ? (
        <style>{`
          input[data-tfb-annotation-text]::placeholder {
            color: ${placeholderAlpha(inputColor)};
          }
        `}</style>
      ) : null}

      <div style={bottomDockStyle}>
        <div role="toolbar" aria-label={messages.annotationToolbar} style={floatingToolbarStyle}>
          <ToolButton
            active={tool === 'select'}
            label={messages.toolSelect}
            onClick={() => switchTool('select')}
          >
            <MousePointer2 size={18} strokeWidth={2} />
          </ToolButton>
          <ToolButton
            active={tool === 'pen'}
            label={messages.toolPen}
            onClick={() => switchTool('pen')}
          >
            <LineSquiggle size={18} strokeWidth={2} />
          </ToolButton>
          <ToolButton
            active={tool === 'rectangle'}
            label={messages.toolRectangle}
            onClick={() => switchTool('rectangle')}
          >
            <Square size={18} strokeWidth={2} />
          </ToolButton>
          <ToolButton
            active={tool === 'text'}
            label={messages.toolText}
            onClick={() => switchTool('text')}
          >
            <Type size={18} strokeWidth={2} />
          </ToolButton>
          <div style={toolbarDividerStyle} />
          {annotationColors.map((c) => (
            <ColorSwatch
              key={c.value}
              color={c.value}
              label={c.label}
              active={activeColor === c.value}
              onClick={() => applyColor(c.value)}
            />
          ))}
          <div style={toolbarDividerStyle} />
          <ToolButton
            active={false}
            label={messages.deleteSelection}
            onClick={deleteSelected}
            disabled={!selectedId}
          >
            <Trash2 size={18} strokeWidth={2} />
          </ToolButton>
        </div>
        <button type="button" onClick={handleSave} style={primaryBtn}>
          {messages.save}
        </button>
      </div>
    </div>,
    document.body,
  )
}

interface ToolButtonProps {
  readonly active: boolean
  readonly label: string
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly children: ReactNode
}

const ToolButton = ({
  active,
  label,
  onClick,
  disabled = false,
  children,
}: ToolButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    aria-label={label}
    aria-pressed={active}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      borderRadius: 8,
      border: active ? '1px solid #8b5cf6' : '1px solid transparent',
      background: active ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
      color: disabled ? '#52525b' : active ? '#c4b5fd' : '#a1a1aa',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    {children}
  </button>
)

interface ColorSwatchProps {
  readonly color: AnnotationColor
  readonly label: string
  readonly active: boolean
  readonly onClick: () => void
}

const ColorSwatch = ({ color, label, active, onClick }: ColorSwatchProps) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={active}
    style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      padding: 0,
      cursor: 'pointer',
      background: color,
      border: active
        ? '2px solid #c4b5fd'
        : color === '#ffffff'
          ? '1px solid rgba(255,255,255,0.35)'
          : '1px solid rgba(0,0,0,0.35)',
      boxShadow: active ? '0 0 0 2px rgba(139, 92, 246, 0.45)' : 'none',
    }}
  />
)

const closeBtnStyle: CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 2147483648,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 44,
  height: 44,
  borderRadius: 22,
  border: 'none',
  background: 'rgba(39, 39, 42, 0.95)',
  color: '#fafafa',
  cursor: 'pointer',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
}

const bottomDockStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: '0 16px 20px',
  flexShrink: 0,
}

const primaryBtn: CSSProperties = {
  padding: '10px 20px',
  borderRadius: 8,
  border: 'none',
  background: '#8b5cf6',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
  flexShrink: 0,
}

const floatingToolbarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: 6,
  borderRadius: 10,
  background: 'rgba(24, 24, 27, 0.95)',
  border: '1px solid #3f3f46',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
}

const toolbarDividerStyle: CSSProperties = {
  width: 1,
  height: 28,
  background: '#3f3f46',
  margin: '0 2px',
}

