export type AnnotationColor = '#000000' | '#ffffff' | '#ef4444'

export interface AnnotationPoint {
  readonly x: number
  readonly y: number
}

export interface RectAnnotationObject {
  readonly id: string
  readonly type: 'rectangle'
  readonly color: AnnotationColor
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface TextAnnotationObject {
  readonly id: string
  readonly type: 'text'
  readonly color: AnnotationColor
  readonly x: number
  readonly y: number
  readonly text: string
}

export interface PenStrokeAnnotationObject {
  readonly id: string
  readonly type: 'pen'
  readonly color: AnnotationColor
  readonly points: readonly AnnotationPoint[]
}

export type AnnotationObject =
  | RectAnnotationObject
  | TextAnnotationObject
  | PenStrokeAnnotationObject

export const cloneAnnotationObjects = (
  objects: readonly AnnotationObject[],
): AnnotationObject[] =>
  objects.map((obj) => {
    if (obj.type === 'pen') {
      return {
        ...obj,
        points: obj.points.map((p) => ({ ...p })),
      }
    }
    return { ...obj }
  })
