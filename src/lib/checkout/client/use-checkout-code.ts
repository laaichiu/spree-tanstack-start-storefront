import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'

import {
  applyCheckoutCode,
  removeCheckoutDiscountCode,
  removeCheckoutGiftCard,
} from '../api/code/checkout-code.functions'
import {
  getCheckoutMutationKey,
  getCheckoutMutationScopeId,
} from './checkout-mutation'
import { cancelCheckoutOrderQueries } from './checkout-query'
import { syncCheckoutOrderQueryData } from './use-checkout-order'

type CheckoutCodeMutationOptions = {
  cartId: string
  market: MarketSelectionInput
}

export function useApplyCheckoutCode({
  cartId,
  market,
}: CheckoutCodeMutationOptions) {
  const queryClient = useQueryClient()
  const applyCheckoutCodeFn = useServerFn(applyCheckoutCode)
  const mutationKey = getCheckoutMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (code: string) =>
      applyCheckoutCodeFn({
        data: {
          cartId,
          code,
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
    onSuccess: (result) => {
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
}

export function useRemoveCheckoutDiscountCode({
  cartId,
  market,
}: CheckoutCodeMutationOptions) {
  const queryClient = useQueryClient()
  const removeCheckoutDiscountCodeFn = useServerFn(removeCheckoutDiscountCode)
  const mutationKey = getCheckoutMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (code: string) =>
      removeCheckoutDiscountCodeFn({
        data: {
          cartId,
          code,
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
    onSuccess: (result) => {
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
}

export function useRemoveCheckoutGiftCard({
  cartId,
  market,
}: CheckoutCodeMutationOptions) {
  const queryClient = useQueryClient()
  const removeCheckoutGiftCardFn = useServerFn(removeCheckoutGiftCard)
  const mutationKey = getCheckoutMutationKey({ cartId, market })

  return useMutation({
    mutationKey,
    scope: { id: getCheckoutMutationScopeId({ cartId, market }) },
    mutationFn: (giftCardId: string) =>
      removeCheckoutGiftCardFn({
        data: {
          cartId,
          giftCardId,
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
    onSuccess: (result) => {
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
}
