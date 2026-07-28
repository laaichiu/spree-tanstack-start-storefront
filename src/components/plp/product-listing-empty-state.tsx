import { Link } from '@tanstack/react-router'

import { EmptyState } from '@/components/sections/empty-state'
import { buttonClassName } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'

export function ProductListingEmptyState({ query }: { query?: string | null }) {
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
          to="/$country/$locale"
        >
          {t('product.backToHome')}
        </Link>
      }
      description={
        query
          ? t('product.tryAnotherSearch')
          : t('product.noProductsDescription')
      }
      title={t('product.noProductsFound')}
    />
  )
}
