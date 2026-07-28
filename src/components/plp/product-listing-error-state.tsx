import { EmptyState } from '@/components/sections/empty-state'
import { useMarket } from '@/components/layout/market-provider'

export function ProductListingErrorState() {
  const { t } = useMarket()

  return (
    <EmptyState
      description={t('product.productsLoadFailedDescription')}
      title={t('product.productsLoadFailed')}
    />
  )
}
