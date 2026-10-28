import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'

import type { ResolvedMarket } from '@/lib/core/market'

type ProductPageForMarketInput = {
  market: ResolvedMarket
  slug: string
}

export const getProductPage = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        market: marketInputSchema,
        slug: z.string().trim().min(1),
      })
      .parse(data)

    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { loadProductPageForMarket } =
      await import('./get-product-page.server')

    return loadProductPageForMarket({
      market: await resolveServerMarket(input.market),
      slug: input.slug,
    })
  })

export const loadProductPageForMarketOnServer = createServerOnlyFn(
  async (input: ProductPageForMarketInput) => {
    const { loadProductPageForMarket } =
      await import('./get-product-page.server')

    return loadProductPageForMarket(input)
  },
)
