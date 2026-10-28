import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { CartEmptyStateView } from '@/components/cart/cart-empty-state-view'

export function CartEmptyState() {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <CartEmptyStateView
      model={{
        description: t('cart.emptyCartDescription'),
        policyLabel: t('footer.shippingPolicy'),
        shopLabel: t('cart.shopAllProducts'),
        title: t('cart.emptyBagHeading'),
      }}
      renderPolicyLink={(content, className) => (
        <Link
          className={className}
          params={{ ...marketParams, slug: 'shipping-policy' }}
          to="/$country/$locale/policies/$slug"
        >
          {content}
        </Link>
      )}
      renderShopLink={(content, className) => (
        <Link
          className={className}
          params={marketParams}
          search={DEFAULT_PRODUCT_LISTING_SEARCH}
          to="/$country/$locale/products"
        >
          {content}
        </Link>
      )}
    />
  )
}
