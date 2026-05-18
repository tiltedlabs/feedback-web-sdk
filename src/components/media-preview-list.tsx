import { Pencil, Trash2 } from 'lucide-react'
import { useState, type CSSProperties } from 'react'

import type { AnnotationObject } from '../annotation-document'
import { MediaPreviewLightbox } from './media-preview-lightbox'

export interface MediaPreviewItem {
  readonly id: string
  readonly file: File
  readonly previewUrl: string
  readonly kind: 'image' | 'video'
  /** Image d’origine (sans annotations aplanies) pour rééditer. */
  readonly sourcePreviewUrl?: string
  readonly sourceFile?: File
  readonly annotations?: readonly AnnotationObject[]
}

export interface MediaPreviewListProps {
  readonly items: readonly MediaPreviewItem[]
  readonly onRemove: (id: string) => void
  readonly onAnnotate?: (id: string) => void
}

const iconButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 6,
  padding: 6,
  cursor: 'pointer',
  background: 'rgba(0,0,0,0.65)',
  color: '#fafafa',
}

export const MediaPreviewList = ({
  items,
  onRemove,
  onAnnotate,
}: MediaPreviewListProps) => {
  const [previewId, setPreviewId] = useState<string | null>(null)
  const previewItem = previewId ? items.find((i) => i.id === previewId) ?? null : null

  if (items.length === 0) {
    return null
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'relative',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #3f3f46',
              background: '#09090b',
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewId(item.id)}
              aria-label={`Agrandir ${item.file.name}`}
              style={{
                display: 'block',
                width: '100%',
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'zoom-in',
              }}
            >
              {item.kind === 'image' ? (
                <img
                  src={item.previewUrl}
                  alt=""
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 140,
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                />
              ) : (
                <video
                  src={item.previewUrl}
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 160,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </button>
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                display: 'flex',
                gap: 4,
              }}
            >
              {item.kind === 'image' && onAnnotate ? (
                <button
                  type="button"
                  onClick={() => onAnnotate(item.id)}
                  style={iconButtonStyle}
                  title="Annoter"
                  aria-label="Annoter"
                >
                  <Pencil size={14} strokeWidth={2} />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                style={iconButtonStyle}
                title="Retirer"
                aria-label="Retirer"
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
            <div
              style={{
                padding: '4px 8px',
                fontSize: 11,
                color: '#a1a1aa',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.file.name}
            </div>
          </div>
        ))}
      </div>
      <MediaPreviewLightbox
        item={previewItem}
        onClose={() => setPreviewId(null)}
      />
    </>
  )
}
