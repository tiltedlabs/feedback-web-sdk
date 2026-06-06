import type { FieldValueInput, FieldValuesState } from './feedback-config'

export function parseDefaultFieldValues(
  raw: Record<string, unknown> | undefined,
): FieldValuesState {
  if (!raw) {
    return {}
  }

  const out: FieldValuesState = {}
  for (const [fieldId, value] of Object.entries(raw)) {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      continue
    }
    const entry = value as Record<string, unknown>
    if (typeof entry.optionId === 'string') {
      out[fieldId] = { optionId: entry.optionId }
      continue
    }
    if (Array.isArray(entry.optionIds)) {
      const optionIds = entry.optionIds.filter(
        (id): id is string => typeof id === 'string',
      )
      if (optionIds.length > 0) {
        out[fieldId] = { optionIds }
      }
    }
  }
  return out
}

export function buildSubmitFieldValues(
  values: FieldValuesState,
  displayFieldIds: readonly string[],
): Record<string, FieldValueInput> {
  const out: Record<string, FieldValueInput> = {}
  for (const fieldId of displayFieldIds) {
    const value = values[fieldId]
    if (!value) {
      continue
    }
    if ('optionId' in value && value.optionId) {
      out[fieldId] = { optionId: value.optionId }
      continue
    }
    if ('optionIds' in value && value.optionIds.length > 0) {
      out[fieldId] = { optionIds: [...value.optionIds] }
    }
  }
  return out
}

export function setSelectFieldValue(
  values: FieldValuesState,
  fieldId: string,
  optionId: string,
): FieldValuesState {
  return { ...values, [fieldId]: { optionId } }
}

export function toggleMultiSelectFieldValue(
  values: FieldValuesState,
  fieldId: string,
  optionId: string,
  selected: boolean,
): FieldValuesState {
  const current = values[fieldId]
  const ids =
    current != null && 'optionIds' in current ? [...current.optionIds] : []
  const next = selected
    ? [...ids, optionId]
    : ids.filter((id) => id !== optionId)
  return { ...values, [fieldId]: { optionIds: next } }
}

export function getSelectedOptionId(
  values: FieldValuesState,
  fieldId: string,
): string | null {
  const current = values[fieldId]
  if (current != null && 'optionId' in current) {
    return current.optionId
  }
  return null
}

export function isMultiSelectOptionSelected(
  values: FieldValuesState,
  fieldId: string,
  optionId: string,
): boolean {
  const current = values[fieldId]
  if (current == null || !('optionIds' in current)) {
    return false
  }
  return current.optionIds.includes(optionId)
}
