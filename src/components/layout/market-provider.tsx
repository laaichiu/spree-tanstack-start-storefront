import { createContext, useContext, useMemo } from 'react'

import type { MessageDictionary, MessageKey } from '@/lib/i18n/messages'
import { fallbackMessages } from '@/lib/i18n/messages'

import type {
  ResolvedMarket,
  StorefrontCountryOption,
  StorefrontLocale,
  StorefrontMarket,
} from '@/lib/core/market'
import { FALLBACK_STOREFRONT_MARKETS } from '@/lib/market/utils/market'
import { findMarket, getCountryOptions } from '@/lib/core/market'

type MarketContextValue = {
  countryOptions: StorefrontCountryOption[]
  localeOptions: StorefrontLocale[]
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  t: (key: MessageKey) => string
}

const MarketContext = createContext<MarketContextValue | undefined>(undefined)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function MarketProvider({
  children,
  market,
  marketOptions,
  messages = fallbackMessages,
}: {
  children: React.ReactNode
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  messages?: MessageDictionary
}) {
  const value = useMemo<MarketContextValue>(() => {
    const options = marketOptions.length
      ? marketOptions
      : FALLBACK_STOREFRONT_MARKETS
    const activeMarket = findMarket(options, market.country) ?? options[0]

    return {
      countryOptions: getCountryOptions(options, market.locale),
      localeOptions: activeMarket.locales,
      market,
      marketOptions: options,
      t: (key) => {
        let resolvedValue: unknown = messages

        for (const segment of key.split('.')) {
          if (!isRecord(resolvedValue) || !(segment in resolvedValue)) {
            return key
          }

          resolvedValue = resolvedValue[segment]
        }

        return typeof resolvedValue === 'string' ? resolvedValue : key
      },
    }
  }, [market, marketOptions, messages])

  return (
    <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
  )
}

export function useMarket() {
  const value = useContext(MarketContext)

  if (!value) {
    throw new Error('useMarket must be used within MarketProvider')
  }

  return value
}
