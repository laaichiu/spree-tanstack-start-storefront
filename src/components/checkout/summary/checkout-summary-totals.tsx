import { useMarket } from '@/components/layout/market-provider'
import type { CartSummary } from '@/lib/cart/contracts'
import { getCheckoutSummaryTotalsRowDisplays } from './checkout-summary-totals-row-display'
import type { CheckoutSummaryPresentation } from './checkout-summary-display'
import { CheckoutDiscountCodeForm } from '../code/checkout-discount-code-form'
import { CheckoutSummaryTotalsView } from '@/components/checkout/checkout-summary-totals-view'

export function CheckoutSummaryTotals({
  cart,
  model,
}: {
  cart: CartSummary
  model: CheckoutSummaryPresentation
}) {
  const { t } = useMarket()

  return (
    <CheckoutSummaryTotalsView
      discountCodeForm={<CheckoutDiscountCodeForm cart={cart} />}
      model={{
        amountDue: model.amountDue,
        currencyCode: model.currencyCode,
        labels: {
          amountDue: t('checkout.amountDue'),
          total: t('cart.total'),
        },
        rows: getCheckoutSummaryTotalsRowDisplays(model.rows),
        total: model.total,
      }}
    />
  )
}
