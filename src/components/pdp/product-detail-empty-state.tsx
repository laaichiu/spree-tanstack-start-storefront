import { useMarket } from '@/components/layout/market-provider'
import { createProductDetailEmptyStateLinks } from '@/components/pdp/product-detail-empty-state-links'
import { EmptyStateView } from '@/components/shared/empty-state-view'

export function ProductDetailEmptyState() {
  const { market, t } = useMarket()

  return (
    <EmptyStateView
      capabilities={createProductDetailEmptyStateLinks({
        marketParams: { country: market.country, locale: market.locale },
      })}
      model={{
        actionLabel: t('product.viewProducts'),
        description: t('product.productUnavailableDescription'),
        title: t('product.productUnavailable'),
      }}
    />
  )
}
