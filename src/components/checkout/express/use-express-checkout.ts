import { useMarket } from '@/components/layout/market-provider'
import { useExpressCheckoutCompletionActions } from '@/lib/checkout/client/use-express-checkout-completion-actions'
import { useExpressCheckoutPaymentActions } from '@/lib/checkout/client/use-express-checkout-payment-actions'
import { useExpressCheckoutShippingActions } from '@/lib/checkout/client/use-express-checkout-shipping-actions'

export function useExpressCheckoutActions({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const shippingActions = useExpressCheckoutShippingActions({ cartId, market })
  const paymentActions = useExpressCheckoutPaymentActions({ cartId, market })
  const completionActions = useExpressCheckoutCompletionActions({
    cartId,
    market,
  })

  return {
    ...completionActions,
    ...paymentActions,
    ...shippingActions,
  }
}
