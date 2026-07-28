import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'

import {
  selectCheckoutShippingRate,
  updateCheckoutAddress,
  updateCheckoutBillingAddress,
} from '@/lib/checkout/api/address/checkout-address.functions'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'
import { syncCheckoutOrderQueryData } from '../use-checkout-order'

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

type CheckoutBillingAddressUpdateInput =
  | {
      billingAddress?: never
      useShipping: true
    }
  | {
      billingAddress: CheckoutBillingAddressInput
      useShipping: false
    }

export function useUpdateCheckoutAddress({ cartId }: { cartId?: string } = {}) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const updateCheckoutAddressFn = useServerFn(updateCheckoutAddress)

  return useMutation({
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
  syncOnSuccess = true,
}: {
  cartId: string
  syncOnSuccess?: boolean
}) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const updateCheckoutBillingAddressFn = useServerFn(
    updateCheckoutBillingAddress,
  )

  return useMutation({
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

export function useSelectCheckoutShippingRate({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const selectCheckoutShippingRateFn = useServerFn(selectCheckoutShippingRate)

  return useMutation({
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
    onSuccess: (order) =>
      syncCheckoutOrderQueryData({
        country: market.country,
        locale: market.locale,
        order,
        queryClient,
      }),
  })
}
