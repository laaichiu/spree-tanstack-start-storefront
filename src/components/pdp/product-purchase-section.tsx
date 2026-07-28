import { Button } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductDisclosureController,
  ProductDetailControllerValue,
} from '@/components/pdp/product-detail-controller'
import { ProductDetailDisclosures } from '@/components/pdp/product-detail-disclosures'
import { ProductDetailOptions } from '@/components/pdp/product-detail-options'
import type { Product } from '@/lib/catalog/model/product'

type ProductPurchaseSectionProps = {
  disclosures: ProductDisclosureController
  product: Product
  purchase: ProductDetailControllerValue['purchase']
}

export function ProductPurchaseSection({
  disclosures,
  product,
  purchase,
}: ProductPurchaseSectionProps) {
  const { t } = useMarket()

  return (
    <>
      <ProductDetailOptions
        onSelectOption={purchase.selectOption}
        product={product}
        selectedOptions={purchase.selectedOptions}
      />

      <div className="pt-7">
        <Button
          className="h-14 w-full border-foreground bg-foreground text-background hover:bg-foreground/90"
          disabled={!purchase.canAddToCart || purchase.isAddingToCart}
          onClick={() => void purchase.addSelectedVariantToCart()}
          size="lg"
        >
          {purchase.isAddingToCart
            ? t('product.addingToBag')
            : product.inStock
              ? t('product.addToBag')
              : t('product.addToBagUnavailable')}
        </Button>
        {purchase.hasAddToCartError ? (
          <p className="mt-3 text-sm leading-6 text-destructive">
            {t('product.addToBagFailed')}
          </p>
        ) : !purchase.canAddToCart ? (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {purchase.availability === 'select_variant'
              ? t('product.variantUnavailable')
              : t('product.purchaseUnavailable')}
          </p>
        ) : null}
      </div>

      <ProductDetailDisclosures
        activeSku={purchase.activeSku}
        expandedSection={disclosures.expandedSection}
        onToggle={disclosures.toggle}
        product={product}
        t={t}
      />
    </>
  )
}
