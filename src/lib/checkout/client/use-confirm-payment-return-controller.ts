import { useEffect, useRef, useState } from 'react'

import { useConfirmCheckoutPayment } from './use-confirm-checkout-payment'
import type { MessageKey } from '../../i18n/messages'
import type {
  ConfirmPaymentCheckoutNavigation,
  ConfirmPaymentOrderPlacedNavigation,
} from '../utils/completion/confirm-payment-return'
import {
  getConfirmPaymentExceptionNavigation,
  getConfirmPaymentResultNavigation,
} from '../utils/completion/confirm-payment-return'
import { getCheckoutCompletionErrorMessage } from '../utils/completion/checkout-completion-error'
import type { CheckoutPaymentReturnSearch } from '../utils/completion/payment-return'

export type ConfirmPaymentReturnNavigation = {
  navigateToCheckout: (
    navigation: ConfirmPaymentCheckoutNavigation,
  ) => Promise<void>
  navigateToOrderPlaced: (
    navigation: ConfirmPaymentOrderPlacedNavigation,
  ) => Promise<void>
}

export function useConfirmPaymentReturnController({
  cartId,
  country,
  locale,
  navigate,
  paymentReturn,
  t,
}: {
  cartId: string
  country: string
  locale: string
  navigate: ConfirmPaymentReturnNavigation
  paymentReturn: CheckoutPaymentReturnSearch
  t: (key: MessageKey) => string
}) {
  const { confirmPayment } = useConfirmCheckoutPayment({
    cartId,
    market: { country, locale },
  })
  const attemptedKeyRef = useRef<string | null>(null)
  const mountedRef = useRef(true)
  const [error, setError] = useState<string | null>(null)
  const attemptKey = JSON.stringify([
    cartId,
    country,
    locale,
    paymentReturn.redirectResult ?? null,
    paymentReturn.session ?? null,
    paymentReturn.sessionId ?? null,
    paymentReturn.sessionResult ?? null,
  ])

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (attemptedKeyRef.current === attemptKey) {
      return
    }

    attemptedKeyRef.current = attemptKey
    setError(null)

    const isCurrentAttempt = () =>
      mountedRef.current && attemptedKeyRef.current === attemptKey

    async function returnToCheckout(
      navigationDescriptor: ConfirmPaymentCheckoutNavigation,
    ) {
      const fallbackMessage = getCheckoutCompletionErrorMessage({
        error: navigationDescriptor.error,
        errorCode: navigationDescriptor.errorCode,
        t,
      })

      try {
        await navigate.navigateToCheckout(navigationDescriptor)
      } catch {
        if (isCurrentAttempt()) {
          setError(fallbackMessage)
        }
      }
    }

    async function redirectToOrderPlaced(
      navigationDescriptor: ConfirmPaymentOrderPlacedNavigation,
    ) {
      try {
        await navigate.navigateToOrderPlaced(navigationDescriptor)
      } catch {
        if (isCurrentAttempt()) {
          setError(
            getCheckoutCompletionErrorMessage({
              errorCode: 'payment_confirmation_failed',
              t,
            }),
          )
        }
      }
    }

    async function confirmAndRedirect() {
      try {
        const result = await confirmPayment(paymentReturn)

        if (!isCurrentAttempt()) {
          return
        }

        const navigation = getConfirmPaymentResultNavigation({
          cartId,
          country,
          locale,
          result,
        })

        if (navigation.kind === 'order_placed') {
          await redirectToOrderPlaced(navigation)
          return
        }

        await returnToCheckout(navigation)
      } catch {
        if (!isCurrentAttempt()) {
          return
        }

        await returnToCheckout(
          getConfirmPaymentExceptionNavigation({
            cartId,
            country,
            locale,
          }),
        )
      }
    }

    void confirmAndRedirect()
  }, [
    attemptKey,
    cartId,
    confirmPayment,
    country,
    locale,
    navigate,
    paymentReturn,
    t,
  ])

  return error
}
