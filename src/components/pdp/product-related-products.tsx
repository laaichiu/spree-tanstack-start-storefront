import { useMarket } from '@/components/layout/market-provider'
import { ProductCard } from '@/components/plp/product-card'
import type { ProductSummary } from '@/lib/catalog/model/product'

type ProductRelatedProductsProps = {
  products: ProductSummary[]
}

export function ProductRelatedProducts({
  products,
}: ProductRelatedProductsProps) {
  const { t } = useMarket()

  if (products.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="related-products-title"
      className="mt-14 space-y-6 lg:mt-20"
    >
      <h2
        className="text-lg leading-none font-normal tracking-wider text-foreground sm:text-xl"
        id="related-products-title"
      >
        {t('product.relatedProducts')}
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant="listing" />
        ))}
      </div>
    </section>
  )
}
