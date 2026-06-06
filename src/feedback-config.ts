export type FeedbackFieldType = 'select' | 'multi_select'

export interface MobileFeedbackDisplayFieldOption {
  readonly id: string
  readonly label: string
  readonly valueKey: string | null
  readonly color: string | null
  readonly sortOrder: number
}

export interface MobileFeedbackDisplayField {
  readonly id: string
  readonly name: string
  readonly fieldType: FeedbackFieldType
  readonly sourceTemplateKey: string | null
  readonly options: readonly MobileFeedbackDisplayFieldOption[]
}

export type FieldValueInput =
  | { readonly optionId: string }
  | { readonly optionIds: readonly string[] }

export type FieldValuesState = Record<string, FieldValueInput>

export interface MobileFeedbackConfig {
  readonly displayFields: readonly MobileFeedbackDisplayField[]
  readonly defaultFieldValues: FieldValuesState
}
