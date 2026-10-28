import {
  DEFAULT_COUNTRY,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_LOCALE,
  formatCurrencyDisplay,
} from '@/lib/core/market'
import type { StorefrontMarket } from '@/lib/core/market'

export const FALLBACK_STOREFRONT_MARKETS: StorefrontMarket[] = [
  {
    countries: [
      {
        country: DEFAULT_COUNTRY,
        countryName: 'United States',
        currencyCode: DEFAULT_CURRENCY_CODE,
        locale: DEFAULT_LOCALE,
        marketId: null,
        marketName: 'United States',
      },
    ],
    currencyCode: DEFAULT_CURRENCY_CODE,
    currencyLabel: formatCurrencyDisplay(DEFAULT_CURRENCY_CODE),
    defaultCountry: DEFAULT_COUNTRY,
    defaultLocale: DEFAULT_LOCALE,
    id: null,
    isDefault: true,
    locales: [
      {
        code: DEFAULT_LOCALE,
        label: 'English',
        shortLabel: 'EN',
      },
    ],
    name: 'United States',
  },
]
