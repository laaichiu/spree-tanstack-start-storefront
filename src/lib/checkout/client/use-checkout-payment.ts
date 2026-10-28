import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { CartShippingRate } from '@/lib/cart/contracts'
import { serializeCheckoutShippingRateReference } from '@/lib/checkout/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { getCartQueryKey } from '../../cart/client/cart-query'
import { completeCheckoutOrder } from '../api/completion/checkout-completion.functions'
import {
  completeCheckoutPaymentSession,
  createCheckoutPaymentSession,
  createDirectCheckoutPayment,
} from '../api/payment/checkout-payment.functions'
import type { CheckoutPaymentSessionInputData } from '../utils/payment/payment-session-contract'
import {
  getCheckoutPaymentMutationKey,
  getCheckoutPaymentMutationScopeId,
} from './checkout-payment-mutation'
import { cancelCheckoutOrderQueries } from './checkout-query'

type CheckoutPaymentMutationOptions = {
  cartId: string
  market: MarketSelectionInput
}

function getMarketInput(market: MarketSelectionInput) {
  return {
    country: market.country,
    locale: market.locale,
  }
}

export function useCreateCheckoutPaymentSession({
  cartId,
  market,
}: CheckoutPaymentMutationOptions) {
  const queryClient = useQueryClient()
  const createPaymentSessionFn = useServerFn(createCheckoutPaymentSession)
  const marketInput = getMarketInput(market)
  const mutationKey = getCheckoutPaymentMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutPaymentMutationScopeId({ cartId, market }) },
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
}

export function useCompleteCheckoutPaymentSession({
  cartId,
  market,
}: CheckoutPaymentMutationOptions) {
  const queryClient = useQueryClient()
  const completePaymentSessionFn = useServerFn(completeCheckoutPaymentSession)
  const marketInput = getMarketInput(market)
  const mutationKey = getCheckoutPaymentMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutPaymentMutationScopeId({ cartId, market }) },
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
}

export function useCreateDirectCheckoutPayment({
  cartId,
  market,
}: CheckoutPaymentMutationOptions) {
  const queryClient = useQueryClient()
  const createDirectPaymentFn = useServerFn(createDirectCheckoutPayment)
  const marketInput = getMarketInput(market)
  const mutationKey = getCheckoutPaymentMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutPaymentMutationScopeId({ cartId, market }) },
    mutationFn: (input: {
      paymentMethodId: string
      selectedShippingRate?: CartShippingRate | null
    }) =>
      createDirectPaymentFn({
        data: {
          cartId,
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
}

export function useCompleteCheckoutOrder({
  cartId,
  market,
}: CheckoutPaymentMutationOptions) {
  const queryClient = useQueryClient()
  const completeOrderFn = useServerFn(completeCheckoutOrder)
  const marketInput = getMarketInput(market)
  const mutationKey = getCheckoutPaymentMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutPaymentMutationScopeId({ cartId, market }) },
    mutationFn: (
      input: { selectedShippingRate?: CartShippingRate | null } = {},
    ) =>
      completeOrderFn({
        data: {
          cartId,
          market: marketInput,
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
    onSuccess: (result) => {
      if (result.success) {
        // The completion response is the source of truth for navigation.
        // Refresh cart consumers in the background so a completed checkout
        // cannot wait for the old cart query to settle or retry.
        try {
          void queryClient
            .invalidateQueries({
              queryKey: getCartQueryKey({
                country: market.country,
                locale: market.locale,
              }),
            })
            .catch(() => undefined)
        } catch {
          // Cart refresh is a background follow-up after order completion.
        }
      }
    },
  })
}
