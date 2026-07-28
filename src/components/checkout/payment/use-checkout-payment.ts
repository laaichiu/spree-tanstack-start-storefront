import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { cartQueryKey } from '@/components/cart/cart-query'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import { useMarket } from '@/components/layout/market-provider'

import { completeCheckoutOrder } from '@/lib/checkout/api/completion/checkout-completion.functions'
import {
  completeCheckoutPaymentSession,
  createCheckoutPaymentSession,
  createDirectCheckoutPayment,
} from '@/lib/checkout/api/payment/checkout-payment.functions'
import type { CheckoutJsonValue } from '@/lib/checkout/model/checkout'
import { serializeCheckoutShippingRateReference } from '@/lib/checkout/utils/shipping/shipping-rate-reference'

type ExternalData = Record<string, CheckoutJsonValue>

export function useCreateCheckoutPaymentSession({
  cartId,
}: {
  cartId: string
}) {
  const { market } = useMarket()
  const createPaymentSessionFn = useServerFn(createCheckoutPaymentSession)

  return useMutation({
    mutationFn: (input: {
      externalData?: ExternalData
      paymentMethodId: string
      selectedShippingRate?: CartShippingRate | null
    }) =>
      createPaymentSessionFn({
        data: {
          cartId,
          externalData: input.externalData,
          market: {
            country: market.country,
            locale: market.locale,
          },
          paymentMethodId: input.paymentMethodId,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      }),
  })
}

export function useCompleteCheckoutPaymentSession({
  cartId,
}: {
  cartId: string
}) {
  const { market } = useMarket()
  const completePaymentSessionFn = useServerFn(completeCheckoutPaymentSession)

  return useMutation({
    mutationFn: (input: {
      externalData?: ExternalData
      selectedShippingRate?: CartShippingRate | null
      sessionId: string
      sessionResult?: string
    }) =>
      completePaymentSessionFn({
        data: {
          cartId,
          externalData: input.externalData,
          market: {
            country: market.country,
            locale: market.locale,
          },
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
          sessionId: input.sessionId,
          sessionResult: input.sessionResult,
        },
      }),
  })
}

export function useCreateDirectCheckoutPayment({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const createDirectPaymentFn = useServerFn(createDirectCheckoutPayment)

  return useMutation({
    mutationFn: (input: {
      paymentMethodId: string
      selectedShippingRate?: CartShippingRate | null
    }) =>
      createDirectPaymentFn({
        data: {
          cartId,
          market: {
            country: market.country,
            locale: market.locale,
          },
          paymentMethodId: input.paymentMethodId,
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      }),
  })
}

export function useCompleteCheckoutOrder({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const completeOrderFn = useServerFn(completeCheckoutOrder)

  return useMutation({
    mutationFn: (
      input: { selectedShippingRate?: CartShippingRate | null } = {},
    ) =>
      completeOrderFn({
        data: {
          cartId,
          market: {
            country: market.country,
            locale: market.locale,
          },
          selectedShippingRate: serializeCheckoutShippingRateReference(
            input.selectedShippingRate,
          ),
        },
      }),
    onSuccess: (result) => {
      if (result.success) {
        // The completion response is the source of truth for navigation.
        // Refresh cart consumers in the background so a completed checkout
        // cannot wait for the old cart query to settle or retry.
        void queryClient.invalidateQueries({
          queryKey: cartQueryKey,
        })
      }
    },
  })
}
