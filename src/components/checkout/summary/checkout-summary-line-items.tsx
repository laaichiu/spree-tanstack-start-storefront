import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import type { CartLineItem } from '@/lib/cart/contracts'
import { getCheckoutSummaryLineItemPresentations } from '@/components/checkout/summary/checkout-summary-line-item-display'
import { CheckoutSummaryLineItemsView } from '@/components/checkout/checkout-summary-line-items-view'

export function CheckoutSummaryLineItems({ items }: { items: CartLineItem[] }) {
  const { market, t } = useMarket()
  const summaryItems = getCheckoutSummaryLineItemPresentations({
    items,
    locale: market.locale,
  })

  return (
    <CheckoutSummaryLineItemsView
      capabilities={{
        renderProductLink: (item, { children, className }) => (
          <Link
            className={className}
            params={{
              country: market.country,
              locale: market.locale,
              slug: item.productSlug,
            }}
            to="/$country/$locale/products/$slug"
          >
            {children}
          </Link>
        ),
      }}
      model={{
        imageFallbackLabel: t('product.imageComingSoon'),
        items: summaryItems,
      }}
    />
  )
}
