export type CartDisplayOption = {
  colorCode?: string
  id: string
  isColor: boolean
  label: string
}

export type CartDisplayOptionsModel = {
  options: readonly CartDisplayOption[]
}
