export type Operator = 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan'

export type FilterField = {
  id: string
  label: string
  type: 'text' | 'select' | 'number' | 'date'
  options?: { label: string; value: string }[]
}

export type Filter = {
  id: string
  field: string
  operator: Operator
  value: string
}

export type FilterBuilderProps = {
  fields: FilterField[]
  filters: Filter[]
  onChange: (filters: Filter[]) => void
  onReset?: () => void
}