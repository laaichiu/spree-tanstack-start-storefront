import { useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'
import {
  completeCheckoutPaymentSession,
  createCheckoutPaymentSession,
} from '@/lib/checkout/api/payment/checkout-payment.functions'
import { prepareExpressCheckoutPayment } from '@/lib/checkout/api/express/checkout-express-payment.functions'
import type { CheckoutJsonValue } from '@/lib/checkout/model/checkout'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { ExpressCheckoutAddressParams } from '@/lib/checkout/utils/express/express-checkout'
import { serializeCheckoutShippingRateReference } from '@/lib/checkout/utils/shipping/shipping-rate-reference'

import { syncCheckoutOrderQueryData } from '../use-checkout-order'

type ExternalData = Record<string, CheckoutJsonValue>

export function useExpressCheckoutPaymentActions({
  cartId,
}: {
  cartId: string
}) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const preparePaymentFn = useServerFn(prepareExpressCheckoutPayment)
  const createPaymentSessionFn = useServerFn(createCheckoutPaymentSession)
  const completePaymentSessionFn = useServerFn(completeCheckoutPaymentSession)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  return {
    completePaymentSession(input: {
      externalData?: ExternalData
      selectedShippingRate?: CartShippingRate | null
      sessionId: string
      sessionResult?: string
    }) {
      return completePaymentSessionFn({
        data: {
          cartId,
          externalData: input.externalData,
          market: marketInput,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
          sessionId: input.sessionId,
          sessionResult: input.sessionResult,
        },
      })
    },
    createPaymentSession(input: {
      externalData?: ExternalData
      paymentMethodId: string
      selectedShippingRate?: CartShippingRate | null
    }) {
      return createPaymentSessionFn({
        data: {
          cartId,
          externalData: input.externalData,
          market: marketInput,
          paymentMethodId: input.paymentMethodId,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      })
    },
    async preparePayment(input: {
      billingAddress: ExpressCheckoutAddressParams
      email: string
      shippingAddress: ExpressCheckoutAddressParams
    }) {
      const result = await preparePaymentFn({
        data: {
          billingAddress: input.billingAddress,
          cartId,
          email: input.email,
          market: marketInput,
          shippingAddress: input.shippingAddress,
        },
      })

      if (result.success) {
        syncCheckoutOrderQueryData({
          country: market.country,
          locale: market.locale,
          order: result.order,
          queryClient,
        })
      }

      return result
    },
  }
}
