import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'

import { useMarket } from '@/components/layout/market-provider'
import {
  applyCheckoutCode,
  removeCheckoutDiscountCode,
  removeCheckoutGiftCard,
} from '@/lib/checkout/api/code/checkout-code.functions'

import { syncCheckoutOrderQueryData } from '../use-checkout-order'

export function useApplyCheckoutCode({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const applyCheckoutCodeFn = useServerFn(applyCheckoutCode)

  return useMutation({
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

export function useRemoveCheckoutDiscountCode({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const removeCheckoutDiscountCodeFn = useServerFn(removeCheckoutDiscountCode)

  return useMutation({
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

export function useRemoveCheckoutGiftCard({ cartId }: { cartId: string }) {
  const { market } = useMarket()
  const queryClient = useQueryClient()
  const removeCheckoutGiftCardFn = useServerFn(removeCheckoutGiftCard)

  return useMutation({
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
