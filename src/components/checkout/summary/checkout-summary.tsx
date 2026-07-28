import type { CartSummary } from '@/lib/cart/model/cart'

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
  return (
    <CheckoutSummaryShell
      cart={cart}
      isMobileOpen={isMobileOpen}
      onMobileToggle={onMobileToggle}
    >
      <div className="space-y-8">
        <CheckoutSummaryLineItems items={cart.items} />
        <CheckoutSummaryTotals cart={cart} />
      </div>
    </CheckoutSummaryShell>
  )
}
