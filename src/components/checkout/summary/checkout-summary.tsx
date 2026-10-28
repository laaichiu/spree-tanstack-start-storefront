import type { CartSummary } from '@/lib/cart/contracts'
import { getCheckoutSummaryPresentation } from './checkout-summary-display'
import { useMarket } from '@/components/layout/market-provider'
import { CheckoutSummaryContentView } from '@/components/checkout/checkout-summary-content-view'

import { CheckoutSummaryLineItems } from './checkout-summary-line-items'
import { CheckoutSummaryShell } from './checkout-summary-shell'
import { CheckoutSummaryTotals } from './checkout-summary-totals'

export type CheckoutSummaryProps = {
  cart: CartSummary
  isMobileOpen: boolean
  onMobileToggle: () => void
}

export function CheckoutSummary({
  cart,
  isMobileOpen,
  onMobileToggle,
}: CheckoutSummaryProps) {
  const { market, t } = useMarket()
  const summary = getCheckoutSummaryPresentation({
    cart,
    labels: {
      additionalDiscount: t('checkout.additionalDiscount'),
      discount: t('cart.discount'),
      freeShipping: t('checkout.freeShipping'),
      giftCardOrStoreCredit: t('checkout.giftCardOrStoreCredit'),
      shipping: t('cart.shipping'),
      shippingPending: t('checkout.enterShippingAddress'),
      subtotal: t('cart.subtotal'),
      tax: t('cart.tax'),
    },
    locale: market.locale,
  })

  return (
    <CheckoutSummaryShell
      isMobileOpen={isMobileOpen}
      model={summary}
      onMobileToggle={onMobileToggle}
      summaryContent={
        <CheckoutSummaryContentView
          slots={{
            lineItems: <CheckoutSummaryLineItems items={cart.items} />,
            totals: <CheckoutSummaryTotals cart={cart} model={summary} />,
          }}
        />
      }
      summaryLabel={t('checkout.orderSummary')}
    />
  )
}
