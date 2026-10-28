import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { serializeCheckoutShippingRateReference } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { prepareExpressCheckoutPayment } from '../api/express/checkout-express-payment.functions'
import type { ExpressCheckoutOrderResult } from '../api/express/checkout-express.types'
import {
  completeCheckoutPaymentSession,
  createCheckoutPaymentSession,
} from '../api/payment/checkout-payment.functions'
import type { ExpressCheckoutAddressParams } from '../utils/express/express-checkout'
import type { CheckoutPaymentSessionInputData } from '../utils/payment/payment-session-contract'
import {
  getCheckoutMutationKey,
  getCheckoutMutationScopeId,
} from './checkout-mutation'
import {
  getCheckoutPaymentMutationKey,
  getCheckoutPaymentMutationScopeId,
} from './checkout-payment-mutation'
import { cancelCheckoutOrderQueries } from './checkout-query'
import { syncCheckoutOrderQueryData } from './use-checkout-order'

type ExpressCheckoutPaymentActionOptions = {
  cartId: string
  market: MarketSelectionInput
}

export function useExpressCheckoutPaymentActions({
  cartId,
  market,
}: ExpressCheckoutPaymentActionOptions) {
  const queryClient = useQueryClient()
  const preparePaymentFn = useServerFn(prepareExpressCheckoutPayment)
  const createPaymentSessionFn = useServerFn(createCheckoutPaymentSession)
  const completePaymentSessionFn = useServerFn(completeCheckoutPaymentSession)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const mutationKey = getCheckoutMutationKey({ cartId, market })
  const paymentMutationKey = getCheckoutPaymentMutationKey({ cartId, market })
  const preparePaymentMutation = useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (input: {
      billingAddress: ExpressCheckoutAddressParams
      email: string
      shippingAddress: ExpressCheckoutAddressParams
    }) =>
      preparePaymentFn({
        data: {
          billingAddress: input.billingAddress,
          cartId,
          email: input.email,
          market: marketInput,
          shippingAddress: input.shippingAddress,
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: (result: ExpressCheckoutOrderResult) => {
      if (!result.success) {
        return
      }

      syncCheckoutOrderQueryData({
        country: market.country,
        locale: market.locale,
        order: result.order,
        queryClient,
      })
    },
  })
  const createPaymentSessionMutation = useMutation({
    mutationKey: paymentMutationKey,
    scope: {
      id: getCheckoutPaymentMutationScopeId({ cartId, market }),
    },
    mutationFn: (input: {
      paymentData?: CheckoutPaymentSessionInputData
      paymentMethodId: string
      selectedShippingRate?: CartShippingRate | null
    }) =>
      createPaymentSessionFn({
        data: {
          cartId,
          paymentData: input.paymentData,
          market: marketInput,
          paymentMethodId: input.paymentMethodId,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
  })
  const completePaymentSessionMutation = useMutation({
    mutationKey: paymentMutationKey,
    scope: {
      id: getCheckoutPaymentMutationScopeId({ cartId, market }),
    },
    mutationFn: (input: {
      selectedShippingRate?: CartShippingRate | null
      sessionId: string
      sessionResult?: string
    }) =>
      completePaymentSessionFn({
        data: {
          cartId,
          market: marketInput,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
          sessionId: input.sessionId,
          sessionResult: input.sessionResult,
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
  })

  return {
    completePaymentSession: completePaymentSessionMutation.mutateAsync,
    createPaymentSession: createPaymentSessionMutation.mutateAsync,
    preparePayment: preparePaymentMutation.mutateAsync,
  }
}
