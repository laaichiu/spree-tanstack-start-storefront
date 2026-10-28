import { useCallback } from 'react'
import { useServerFn } from '@tanstack/react-start'

import type { MarketSelectionInput } from '@/lib/core/market'

import { confirmCheckoutPaymentAndCompleteOrder } from '../api/completion/checkout-completion.functions'
import { buildConfirmCheckoutPaymentInputData } from '../utils/completion/confirm-payment-return'
import type { CheckoutPaymentReturnSearch } from '../utils/completion/payment-return'

type ConfirmCheckoutPaymentOptions = {
  cartId: string
  market: MarketSelectionInput
}

export function useConfirmCheckoutPayment({
  cartId,
  market,
}: ConfirmCheckoutPaymentOptions) {
  const confirmPaymentFn = useServerFn(confirmCheckoutPaymentAndCompleteOrder)

  const confirmPayment = useCallback(
    (paymentReturn: CheckoutPaymentReturnSearch) =>
      confirmPaymentFn({
        data: buildConfirmCheckoutPaymentInputData({
          cartId,
          country: market.country,
          locale: market.locale,
          ...paymentReturn,
        }),
      }),
    [cartId, confirmPaymentFn, market.country, market.locale],
  )

  return { confirmPayment }
}
