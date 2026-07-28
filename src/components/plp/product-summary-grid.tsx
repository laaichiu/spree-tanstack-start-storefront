import { ProductCard } from '@/components/plp/product-card'
import type { ProductSummary } from '@/lib/catalog/model/product'

type ProductSummaryGridProps = {
  products: ProductSummary[]
}

export function ProductSummaryGrid({ products }: ProductSummaryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-8 pb-16 md:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant="listing" />
      ))}
    </div>
  )
}
