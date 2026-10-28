import { createServerFn } from '@tanstack/react-start'

export const persistMarketPreference = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { persistMarketPreferenceForRequest } =
      await import('./persist-market-preference.server')

    return persistMarketPreferenceForRequest(data)
  })
