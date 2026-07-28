import { createServerFn } from '@tanstack/react-start'

type StorefrontMarketsInput = {
  country?: string
  locale?: string
}

export const getStorefrontMarkets = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as StorefrontMarketsInput | undefined)
  .handler(async ({ data }: { data: StorefrontMarketsInput | undefined }) => {
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = marketInputSchema
      .pick({ country: true, locale: true })
      .partial()
      .optional()
      .default({})
      .parse(data)
    const { getStorefrontMarketsForRequest } =
      await import('./get-storefront-markets.server')

    return getStorefrontMarketsForRequest(input)
  })
