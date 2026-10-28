import type { ReactNode } from 'react'

export type MarketSelectorOption = {
  label: string
  value: string
}

export type MarketSelectorTriggerProps = {
  countryFlag: ReactNode
  currencyCode: string
  localeLabel: string
}

export type MarketSelectorModel = {
  applyLabel: string
  closeLabel: string
  countryLabel: string
  countryOptions: readonly MarketSelectorOption[]
  description: string
  draftCountry: string
  draftLocale: string
  hasSelectedMarket: boolean
  languageLabel: string
  localeOptions: readonly MarketSelectorOption[]
  open: boolean
  switchError: string | null
  variant: 'footer' | 'menu'
  isSwitchingMarket: boolean
  title: string
}

export type MarketSelectorActions = {
  apply: () => void
  countryChange: (country: string) => void
  localeChange: (locale: string) => void
  openChange: (open: boolean) => void
}

export type MarketSelectorProps = {
  actions: MarketSelectorActions
  className?: string
  model: MarketSelectorModel
  trigger: ReactNode
}
