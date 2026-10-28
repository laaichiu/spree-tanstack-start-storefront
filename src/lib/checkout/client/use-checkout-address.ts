import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/contracts'

import {
  selectCheckoutShippingRate,
  updateCheckoutAddress,
  updateCheckoutBillingAddress,
} from '../api/address/checkout-address.functions'
import {
  getCheckoutBillingAddressMutationKey,
  getCheckoutMutationScopeId,
  getCheckoutShippingAddressMutationKey,
  getCheckoutShippingRateMutationKey,
} from './checkout-mutation'
import { cancelCheckoutOrderQueries } from './checkout-query'
import { syncCheckoutOrderQueryData } from './use-checkout-order'

type CheckoutAddressMutationOptions = {
  market: MarketSelectionInput
}

type CheckoutShippingRateInput = {
  deliveryRateId: string
  fulfillmentId: string
}

export type CheckoutAddressUpdateInput =
  | CheckoutAddressInput
  | {
      email?: string
      shippingAddressId: string
    }

export type CheckoutBillingAddressUpdateInput =
  | {
      billingAddress?: never
      useShipping: true
    }
  | {
      billingAddress: CheckoutBillingAddressInput
      useShipping: false
    }

export function useUpdateCheckoutAddress({
  cartId,
  market,
}: CheckoutAddressMutationOptions & { cartId?: string }) {
  const queryClient = useQueryClient()
  const updateCheckoutAddressFn = useServerFn(updateCheckoutAddress)
  const mutationKey = getCheckoutShippingAddressMutationKey({
    cartId: cartId ?? '',
    market,
  })

  return useMutation({
    mutationKey,
    scope: {
      id: getCheckoutMutationScopeId({ cartId: cartId ?? '', market }),
    },
    mutationFn: (input: CheckoutAddressUpdateInput) =>
      updateCheckoutAddressFn({
        data: {
          ...('shippingAddressId' in input ? input : { address: input }),
          cartId,
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: (order) =>
      syncCheckoutOrderQueryData({
        country: market.country,
        locale: market.locale,
        order,
        queryClient,
      }),
  })
}

export function useUpdateCheckoutBillingAddress({
  cartId,
  market,
  syncOnSuccess = true,
}: CheckoutAddressMutationOptions & {
  cartId: string
  syncOnSuccess?: boolean
}) {
  const queryClient = useQueryClient()
  const updateCheckoutBillingAddressFn = useServerFn(
    updateCheckoutBillingAddress,
  )
  const mutationKey = getCheckoutBillingAddressMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (input: CheckoutBillingAddressUpdateInput) =>
      updateCheckoutBillingAddressFn({
        data: {
          ...input,
          cartId,
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: syncOnSuccess
      ? (order) =>
          syncCheckoutOrderQueryData({
            country: market.country,
            locale: market.locale,
            order,
            queryClient,
          })
      : undefined,
  })
}

export function useSelectCheckoutShippingRate({
  cartId,
  market,
}: CheckoutAddressMutationOptions & { cartId: string }) {
  const queryClient = useQueryClient()
  const selectCheckoutShippingRateFn = useServerFn(selectCheckoutShippingRate)
  const mutationKey = getCheckoutShippingRateMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (input: CheckoutShippingRateInput) =>
      selectCheckoutShippingRateFn({
        data: {
          cartId,
          deliveryRateId: input.deliveryRateId,
          fulfillmentId: input.fulfillmentId,
          market: {
            country: market.country,
            locale: market.locale,
          },
        },
      }),
    onMutate: () =>
      cancelCheckoutOrderQueries({
        cartId,
        country: market.country,
        locale: market.locale,
        queryClient,
      }),
    onSuccess: (order) =>
      syncCheckoutOrderQueryData({
        country: market.country,
        locale: market.locale,
        order,
        queryClient,
      }),
  })
}
