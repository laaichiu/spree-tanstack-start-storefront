import { createServerFn } from '@tanstack/react-start'
import type {
  Category as SpreeCategory,
  Client as SpreeClient,
  Product as SpreeProduct,
} from '@spree/sdk'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'
import type { MarketSelectionInput } from '@/lib/market/model/market'
import { reportError } from '@/lib/observability/report-error'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'

import { mapSpreeProductToProduct } from '../mappers/product.mapper'

type ProductDetailInput = {
  market: MarketSelectionInput
  slug: string
}

function getPreferredBreadcrumbCategory(
  product: SpreeProduct,
): SpreeCategory | null {
  const categories = product.categories ?? []

  if (categories.length === 0) {
    return null
  }

  const nonRootCategories = categories.filter((category) => !category.is_root)

  if (nonRootCategories.length > 0) {
    return nonRootCategories.sort(
      (first, second) => second.depth - first.depth,
    )[0]
  }

  return categories[0]
}

function categoryHasBreadcrumbAncestors(category: SpreeCategory) {
  return category.ancestors?.some((ancestor) => !ancestor.is_root) ?? false
}

async function hydrateProductBreadcrumbCategory({
  client,
  product,
}: {
  client: SpreeClient
  product: SpreeProduct
}): Promise<SpreeProduct> {
  const category = getPreferredBreadcrumbCategory(product)

  if (!category || categoryHasBreadcrumbAncestors(category)) {
    return product
  }

  try {
    const expandedCategory = await client.categories.get(category.permalink, {
      expand: ['ancestors'],
    })
    const otherCategories = (product.categories ?? []).filter(
      (candidate) => candidate.id !== expandedCategory.id,
    )

    return {
      ...product,
      categories: [expandedCategory, ...otherCategories],
    }
  } catch (error) {
    reportError({
      context: 'products.detail.categoryBreadcrumb',
      error,
    })

    return product
  }
}

export const getProductDetail = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as ProductDetailInput)
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
    const market = await resolveServerMarket(input.market)
    const client = getServerSpreeClientForMarket(market)
    const product = await client.products.get(input.slug, {
      expand: [
        'primary_media',
        'media',
        'default_variant',
        'variants',
        'categories.ancestors',
        'custom_fields',
      ],
    })
    const productWithBreadcrumbCategory =
      await hydrateProductBreadcrumbCategory({ client, product })

    return mapSpreeProductToProduct(productWithBreadcrumbCategory)
  })
