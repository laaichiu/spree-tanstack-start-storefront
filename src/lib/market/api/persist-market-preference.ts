import { createServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '../model/market'

export const persistMarketPreference = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as MarketSelectionInput)
  .handler(async ({ data }) => {
    const { persistMarketPreferenceForRequest } =
      await import('./persist-market-preference.server')

    return persistMarketPreferenceForRequest(data)
  })
