import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { ConfirmPaymentNavigation } from '@/lib/checkout/utils/completion/confirm-payment-return'
import { useConfirmPaymentReturnController } from '@/lib/checkout/client/use-confirm-payment-return-controller'
import type { CheckoutPaymentReturnSearch } from '@/lib/checkout/utils/completion/payment-return'

export function useCheckoutConfirmPaymentController({
  cartId,
  country,
  locale,
  paymentReturn,
}: {
  cartId: string
  country: string
  locale: string
  paymentReturn: CheckoutPaymentReturnSearch
}) {
  const { t } = useMarket()
  const navigate = useNavigate()
  const navigateToRoute = useCallback(
    (navigation: ConfirmPaymentNavigation) => {
      if (navigation.kind === 'order_placed') {
        return navigate({
          params: navigation.params,
          replace: true,
          to: navigation.to,
        })
      }

      return navigate({
        params: navigation.params,
        replace: true,
        search: navigation.search,
        to: navigation.to,
      })
    },
    [navigate],
  )

  return useConfirmPaymentReturnController({
    cartId,
    country,
    locale,
    navigate: {
      navigateToCheckout: navigateToRoute,
      navigateToOrderPlaced: navigateToRoute,
    },
    paymentReturn,
    t,
  })
}
