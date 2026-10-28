import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'

import type { ResolvedMarket } from '@/lib/core/market'
import { parseProductListingSearch } from '@/lib/catalog/contracts'
import type { ProductListingSearch } from '@/lib/catalog/contracts'

type BrandsForMarketInput = {
  market: ResolvedMarket
}

type BrandProductsInput = BrandsForMarketInput & {
  search: ProductListingSearch
  sellerId: string
}

export const getBrands = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z.object({ market: marketInputSchema }).parse(data)
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getBrandsForMarket } = await import('./get-brands.server')

    return getBrandsForMarket({
      market: await resolveServerMarket(input.market),
    })
  })

export const getBrand = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({ market: marketInputSchema, slug: z.string().trim().min(1) })
      .parse(data)
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getBrandForMarket } = await import('./get-brands.server')

    return getBrandForMarket({
      market: await resolveServerMarket(input.market),
      slug: input.slug,
    })
  })

export const getBrandProducts = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        market: marketInputSchema,
        // The parsed route search contract intentionally contains undefined
        // values for inactive filters. Keep those values valid at the server
        // function boundary; parseProductListingSearch normalizes them below.
        search: z.record(z.string(), z.json().optional()).default({}),
        sellerId: z.string().trim().min(1),
      })
      .parse(data)
    const { resolveServerMarket } =
      await import('@/lib/market/api/resolve-server-market')
    const { getBrandProductsForMarket } =
      await import('./get-brand-products.server')

    return getBrandProductsForMarket({
      market: await resolveServerMarket(input.market),
      search: parseProductListingSearch(input.search),
      sellerId: input.sellerId,
    })
  })

export const loadBrandsForMarketOnServer = createServerOnlyFn(
  async ({ market }: BrandsForMarketInput) => {
    const { getBrandsForMarket } = await import('./get-brands.server')
    return getBrandsForMarket({ market })
  },
)

export const loadBrandForMarketOnServer = createServerOnlyFn(
  async ({ market, slug }: BrandsForMarketInput & { slug: string }) => {
    const { getBrandForMarket } = await import('./get-brands.server')
    return getBrandForMarket({ market, slug })
  },
)

export const loadBrandProductsForMarketOnServer = createServerOnlyFn(
  async ({ market, search, sellerId }: BrandProductsInput) => {
    const { getBrandProductsForMarket } =
      await import('./get-brand-products.server')
    return getBrandProductsForMarket({ market, search, sellerId })
  },
)
