import { createServerFn } from '@tanstack/react-start'

export const getPreferredMarketPath = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getPreferredMarketPathForRequest } =
      await import('./get-preferred-market.server')

    return getPreferredMarketPathForRequest()
  },
)
