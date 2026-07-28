export type StorefrontMarket = {
  countries: StorefrontCountryOption[]
  currencyCode: string
  currencyLabel: string
  defaultCountry: string
  defaultLocale: string
  id: string | null
  isDefault: boolean
  locales: StorefrontLocale[]
  name: string
}

export type StorefrontLocale = {
  code: string
  label: string
  shortLabel: string
}

export type StorefrontCountryOption = {
  country: string
  countryName: string
  currencyCode: string
  locale: string
  marketId: string | null
  marketName: string
}

export type ResolvedMarket = {
  country: string
  countryName: string
  currencyCode: string
  currencyLabel: string
  locale: string
  localeLabel: string
  localeShortLabel: string
  marketId: string | null
  marketName: string
}

export type MarketSelectionInput = {
  country: string
  countryName?: string
  currencyCode?: string
  currencyLabel?: string
  locale: string
  localeLabel?: string
  localeShortLabel?: string
  marketId?: string | null
  marketName?: string
}
