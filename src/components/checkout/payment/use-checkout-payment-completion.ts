import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { RefObject } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import {
  getConfirmPaymentRouteNavigation,
  getOrderPlacedRouteNavigation,
} from '@/lib/checkout/utils/checkout-navigation'

import type { CheckoutPaymentSectionHandle } from './checkout-payment-section'
import { getCheckoutRenderedPaymentSubmitAction } from './checkout-payment-submit-result'
import type { CheckoutSectionErrorKey } from '../checkout-requirements'

type CheckoutPaymentCompletionOptions = {
  cartId: string
  paymentSectionRef: RefObject<CheckoutPaymentSectionHandle | null>
  setCheckoutError: (error: string | null) => void
  setSingleCheckoutSectionError: (
    section: CheckoutSectionErrorKey,
    message: string,
  ) => void
}

export function useCheckoutPaymentCompletion({
  cartId,
  paymentSectionRef,
  setCheckoutError,
  setSingleCheckoutSectionError,
}: CheckoutPaymentCompletionOptions) {
  const { market, t } = useMarket()
  const navigate = useNavigate()

  return useCallback(async () => {
    const result = await paymentSectionRef.current?.submit()
    const action = getCheckoutRenderedPaymentSubmitAction({
      cartId,
      paymentFormNotReadyMessage: t('checkout.paymentFormNotReady'),
      result,
    })

    if (action.type === 'show_payment_error') {
      setCheckoutError(action.message)
      setSingleCheckoutSectionError('payment', action.message)
      return
    }

    if (action.type === 'ignore_error') {
      return
    }

    const marketRouteParams = {
      country: market.country,
      locale: market.locale,
    }

    if (action.type === 'confirm_payment') {
      await navigate(
        getConfirmPaymentRouteNavigation({
          cartId,
          ...marketRouteParams,
        }),
      )
      return
    }

    await navigate(
      getOrderPlacedRouteNavigation({
        orderId: action.orderId,
        ...marketRouteParams,
      }),
    )
  }, [
    cartId,
    market.country,
    market.locale,
    navigate,
    paymentSectionRef,
    setCheckoutError,
    setSingleCheckoutSectionError,
    t,
  ])
}
