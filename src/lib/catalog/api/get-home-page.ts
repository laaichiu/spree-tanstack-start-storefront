import type { HomePageInput } from './get-home-page-loader'
import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'

import type { ResolvedMarket } from '@/lib/market/model/market'

export { loadHomePage } from './get-home-page-loader'
export type { HomePageInput, HomePageLoaders } from './get-home-page-loader'

export const getHomePage = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as HomePageInput)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z.object({ market: marketInputSchema }).parse(data)

    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { loadHomePageForMarket } = await import('./get-home-page.server')

    return loadHomePageForMarket(await resolveServerMarket(input.market))
  })

export const loadHomePageForMarketOnServer = createServerOnlyFn(
  async (market: ResolvedMarket) => {
    const { loadHomePageForMarket } = await import('./get-home-page.server')

    return loadHomePageForMarket(market)
  },
)
