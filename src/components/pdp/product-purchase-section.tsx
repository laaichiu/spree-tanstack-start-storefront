import type { Product } from '@/lib/catalog/contracts'

import { useMarket } from '@/components/layout/market-provider'
import type { ProductDisclosureController } from '@/components/pdp/product-detail-controller'
import type { ProductPurchaseController } from '@/lib/catalog/client/use-product-purchase'
import { ProductDisclosuresView } from './product-disclosures-view'
import { ProductOptionSelectorView } from './product-option-selector-view'
import { ProductPurchaseActionView } from './product-purchase-action-view'
import { getProductOptionSelectorModel } from './product-option-selector-model'

export function ProductPurchaseSection({
  disclosures,
  product,
  purchase,
}: {
  disclosures: ProductDisclosureController
  product: Product
  purchase: ProductPurchaseController
}) {
  const { t } = useMarket()
  return (
    <>
      <ProductOptionSelectorView
        model={getProductOptionSelectorModel(product, purchase.selectedOptions)}
        onSelectOption={purchase.selectOption}
      />

      <ProductPurchaseActionView
        copy={{
          addToBag: t('product.addToBag'),
          addToBagFailed: t('product.addToBagFailed'),
          addingToBag: t('product.addingToBag'),
          preorder: t('product.preorder'),
          purchaseUnavailable: t('product.addToBagUnavailable'),
          variantUnavailable: t('product.variantUnavailable'),
        }}
        model={{
          availability: purchase.availability,
          canAddToCart: purchase.canAddToCart,
          hasAddToCartError: purchase.hasAddToCartError,
          isAddingToCart: purchase.isAddingToCart,
          isPreorder: purchase.isPreorder,
        }}
        onAddToCart={purchase.addSelectedVariantToCart}
      />

      <ProductDisclosuresView
        expandedSection={disclosures.expandedSection}
        model={{
          activeSku: purchase.activeSku,
          copy: {
            description: t('product.description'),
            details: t('product.details'),
            itemNumberLabel: t('product.itemNumber'),
            noAdditionalProperties: t('product.noAdditionalProperties'),
            productUnavailableDescription: t(
              'product.productUnavailableDescription',
            ),
          },
          description: product.description,
          descriptionHtml: product.descriptionHtml,
          specifications: product.specifications,
        }}
        onToggle={disclosures.toggle}
      />
    </>
  )
}
