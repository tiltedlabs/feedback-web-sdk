import type { CSSProperties } from 'react'

import type {
  FieldValuesState,
  MobileFeedbackDisplayField,
} from '../feedback-config'
import {
  getSelectedOptionId,
  isMultiSelectOptionSelected,
  setSelectFieldValue,
  toggleMultiSelectFieldValue,
} from '../field-values'
import { optionChipPalette } from '../option-chip-style'
import { feedbackTheme } from '../styles/feedback-theme'

export interface FeedbackDisplayFieldsProps {
  readonly fields: readonly MobileFeedbackDisplayField[]
  readonly values: FieldValuesState
  readonly onChange: (next: FieldValuesState) => void
}

export const FeedbackDisplayFields = ({
  fields,
  values,
  onChange,
}: FeedbackDisplayFieldsProps) => {
  if (fields.length === 0) {
    return null
  }

  return (
    <>
      {fields.map((field) => {
        const sortedOptions = [...field.options].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )

        return (
          <div key={field.id}>
            <span style={labelStyle}>{field.name}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {sortedOptions.map((option) => {
                const selected =
                  field.fieldType === 'select'
                    ? getSelectedOptionId(values, field.id) === option.id
                    : isMultiSelectOptionSelected(values, field.id, option.id)
                const palette = optionChipPalette(option.color, option.valueKey)

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      if (field.fieldType === 'select') {
                        onChange(setSelectFieldValue(values, field.id, option.id))
                        return
                      }
                      onChange(
                        toggleMultiSelectFieldValue(
                          values,
                          field.id,
                          option.id,
                          !selected,
                        ),
                      )
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: `1px solid ${selected ? palette.border : '#3f3f46'}`,
                      background: selected ? palette.background : 'transparent',
                      color: selected ? palette.text : feedbackTheme.textMuted,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: selected ? 600 : 500,
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: feedbackTheme.textMuted,
  marginBottom: 4,
}
