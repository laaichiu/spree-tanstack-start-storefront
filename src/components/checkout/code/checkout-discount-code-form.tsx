import type { CartSummary } from '@/lib/cart/contracts'
import { CheckoutDiscountCodeFormView } from '@/components/checkout/checkout-discount-code-form-view'
import { useCheckoutDiscountCodeController } from './use-checkout-discount-code-controller'

export function CheckoutDiscountCodeForm({ cart }: { cart: CartSummary }) {
  const { actions, model } = useCheckoutDiscountCodeController({ cart })

  return <CheckoutDiscountCodeFormView actions={actions} model={model} />
}
