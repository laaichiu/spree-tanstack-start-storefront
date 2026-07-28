import { Link } from '@tanstack/react-router'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import { EmptyState } from '@/components/sections/empty-state'
import { buttonClassName } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'

export function ProductDetailEmptyState() {
  const { market, t } = useMarket()

  return (
    <EmptyState
      actions={
        <Link
          className={buttonClassName({ variant: 'secondary' })}
          params={{
            country: market.country,
            locale: market.locale,
          }}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {t('product.viewProducts')}
        </Link>
      }
      description={t('product.productUnavailableDescription')}
      title={t('product.productUnavailable')}
    />
  )
}
