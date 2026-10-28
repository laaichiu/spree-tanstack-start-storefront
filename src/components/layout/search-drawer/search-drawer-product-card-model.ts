import type { ProductSummary } from '@/lib/catalog/contracts'
import type { SearchProductCardModel } from '@/components/contracts/search'
import { getMoneyDisplay } from '@/components/shared/money-display'
import { getProductCardDisplay } from '@/components/catalog/product-card-display'

export function getSearchProductCardModel(
  product: ProductSummary,
  locale: string,
): SearchProductCardModel {
  const display = getProductCardDisplay(product, null)

  return {
    ...getMoneyDisplay(display.price, display.compareAtPrice, locale, {
      unitPrice: true,
    }),
    attribution: product.brand?.name ?? null,
    image: display.image,
    name: product.name,
  }
}
