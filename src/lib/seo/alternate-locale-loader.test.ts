import type { StorefrontMarket } from '@/lib/market/model/market'
import { describe, expect, it } from 'vitest'

import { getStorefrontMarketOptionsFromMatches } from './alternate-locale-loader'

const marketOptions: StorefrontMarket[] = [
  {
    countries: [],
    currencyCode: 'USD',
    currencyLabel: '$USD',
    defaultCountry: 'us',
    defaultLocale: 'en',
    id: 'market-us',
    isDefault: true,
    locales: [],
    name: 'United States',
  },
]

describe('alternate locale route adapter', () => {
  it('reads market options from the parent route match', () => {
    expect(
      getStorefrontMarketOptionsFromMatches([
        { loaderData: { marketOptions } },
      ]),
    ).toBe(marketOptions)
  })

  it('returns no options when the parent match has no shell data', () => {
    expect(
      getStorefrontMarketOptionsFromMatches([
        { loaderData: null },
        { loaderData: { page: {} } },
      ]),
    ).toEqual([])
  })
})
