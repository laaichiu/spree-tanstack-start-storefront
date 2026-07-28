import type { ProductSummary } from '../model/product'

export function selectRelatedProductSummaries({
  currentProductId,
  limit,
  products,
}: {
  currentProductId: string
  limit: number
  products: ProductSummary[]
}) {
  return products
    .filter((product) => product.id !== currentProductId)
    .slice(0, limit)
}
