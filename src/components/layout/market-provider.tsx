import { createContext, useContext, useMemo } from 'react'

import type { MessageDictionary, MessageKey } from '@/lib/i18n/messages'
import { getMessage } from '@/lib/i18n/messages'

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

export function MarketProvider({
  children,
  market,
  marketOptions,
  messages,
}: {
  children: React.ReactNode
  market: ResolvedMarket
  marketOptions: StorefrontMarket[]
  messages: MessageDictionary
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
      t: (key) => getMessage(messages, key),
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
