import { MessageSquarePlus, X } from 'lucide-react'

import { FEEDBACK_UI_ATTR } from '../utils/capture-region'
import { feedbackTheme } from '../styles/feedback-theme'

export interface FloatingTriggerProps {
  readonly open: boolean
  readonly onClick: () => void
  readonly accentColor?: string
}

export const FloatingTrigger = ({
  open,
  onClick,
  accentColor = feedbackTheme.accent,
}: FloatingTriggerProps) => (
  <button
    {...{ [FEEDBACK_UI_ATTR]: '' }}
    type="button"
    aria-label={open ? 'Fermer le feedback' : 'Ouvrir le feedback'}
    onClick={onClick}
    style={{
      position: 'fixed',
      right: 20,
      bottom: 20,
      zIndex: 2147483000,
      width: 56,
      height: 56,
      borderRadius: 28,
      border: 'none',
      cursor: 'pointer',
      background: accentColor,
      color: '#fff',
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {open ? <X size={24} strokeWidth={2.25} /> : <MessageSquarePlus size={24} strokeWidth={2.25} />}
  </button>
)
