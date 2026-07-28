import { useExpressCheckoutCompletionActions } from './use-express-checkout-completion-actions'
import { useExpressCheckoutPaymentActions } from './use-express-checkout-payment-actions'
import { useExpressCheckoutShippingActions } from './use-express-checkout-shipping-actions'

export function useExpressCheckoutActions({ cartId }: { cartId: string }) {
  const shippingActions = useExpressCheckoutShippingActions({ cartId })
  const paymentActions = useExpressCheckoutPaymentActions({ cartId })
  const completionActions = useExpressCheckoutCompletionActions({ cartId })

  return {
    ...completionActions,
    ...paymentActions,
    ...shippingActions,
  }
}
