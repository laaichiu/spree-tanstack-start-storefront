import { useState } from 'react'

import type {
  StorefrontCountryOption,
  StorefrontMarket,
} from '@/lib/market/model/market'
import { findMarket } from '@/lib/market/utils/market'
import { countryToFlag } from '@/lib/market/utils/market-format'

export function CountryFlagIcon({ countryCode }: { countryCode: string }) {
  const [hasImageError, setHasImageError] = useState(false)
  const normalizedCountryCode = countryCode.trim().toLowerCase()
  const fallbackFlag = countryToFlag(normalizedCountryCode)

  if (!normalizedCountryCode || hasImageError) {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-lg leading-none shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
        {fallbackFlag}
      </span>
    )
  }

  return (
    <span className="block h-4 w-4 overflow-hidden rounded-full border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.08)]">
      <img
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        onError={() => setHasImageError(true)}
        src={`/flags/1x1/${normalizedCountryCode}.svg`}
      />
    </span>
  )
}

export function findCountryOption(
  countryOptions: StorefrontCountryOption[],
  country: string,
) {
  return countryOptions.find((option) => option.country === country) ?? null
}

export function findMarketForCountryOption(
  marketOptions: StorefrontMarket[],
  countryOption: StorefrontCountryOption | null,
) {
  if (!countryOption) return null

  return (
    marketOptions.find((option) => option.id === countryOption.marketId) ??
    findMarket(marketOptions, countryOption.country)
  )
}

export function getValidLocaleForMarket(
  market: StorefrontMarket,
  locale: string,
) {
  return (
    market.locales.find((option) => option.code === locale)?.code ??
    market.locales.find(
      (option) => option.code.split('-')[0] === locale.split('-')[0],
    )?.code ??
    market.locales.find((option) => option.code === market.defaultLocale)
      ?.code ??
    market.defaultLocale
  )
}

export function getMarketSelectorTriggerClasses(variant: 'footer' | 'menu') {
  return variant === 'menu'
    ? 'flex w-full items-center justify-center border-t border-border px-6 py-5 text-center transition-opacity hover:opacity-70'
    : 'link-underline-sweep inline-flex items-center pb-1 text-left after:bottom-0 focus-visible:focus-ring'
}
