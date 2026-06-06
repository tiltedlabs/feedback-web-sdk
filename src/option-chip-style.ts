import { WEB_FEEDBACK_PRIORITY_STYLES, type WebFeedbackPriority } from './priorities'

export interface OptionChipPalette {
  readonly text: string
  readonly border: string
  readonly background: string
}

const FALLBACK_PALETTE: OptionChipPalette = {
  text: '#a1a1aa',
  border: '#52525b',
  background: 'rgba(161, 161, 170, 0.15)',
}

function hexWithAlpha(hex: string, alphaHex: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return `${hex}${alphaHex}`
  }
  return hex
}

export function optionChipPalette(
  color: string | null,
  valueKey: string | null,
): OptionChipPalette {
  if (color) {
    return {
      text: color,
      border: color,
      background: hexWithAlpha(color, '33'),
    }
  }

  if (valueKey != null && valueKey in WEB_FEEDBACK_PRIORITY_STYLES) {
    return WEB_FEEDBACK_PRIORITY_STYLES[valueKey as WebFeedbackPriority]
  }

  return FALLBACK_PALETTE
}
