import '@tanstack/react-start/server-only'

import type { CheckoutShippingRateReference } from '@/lib/checkout/contracts'
import { getServerSpreeClientForMarket } from '@/lib/spree/client.server'
import { assertPaymentMatchesPaymentMethod } from '@/lib/checkout/utils/payment/payment-identity'

import { getCheckoutCartRequestOptions } from '../checkout-session.server'
import type { CheckoutMarket } from '../checkout-session.server'
import { requireCheckoutPaymentMethod } from './checkout-payment-validation.server'

export async function createDirectCheckoutPaymentOnServer({
  cartId,
  cartToken,
  market,
  paymentMethodId,
  selectedShippingRate,
}: {
  cartId: string
  cartToken?: string
  market: CheckoutMarket
  paymentMethodId: string
  selectedShippingRate: CheckoutShippingRateReference | undefined
}): Promise<{ success: true }> {
  const { cartToken: updatedCartToken } = await requireCheckoutPaymentMethod({
    cartId,
    cartToken,
    expectedCurrentCartToken: cartToken,
    market,
    paymentMethodId,
    selectedShippingRate,
  })

  const requestOptions = getCheckoutCartRequestOptions(updatedCartToken)

  const payment = await getServerSpreeClientForMarket(
    market,
  ).carts.payments.create(
    cartId,
    {
      payment_method_id: paymentMethodId,
    },
    requestOptions,
  )

  assertPaymentMatchesPaymentMethod(payment, paymentMethodId)

  return { success: true }
}
