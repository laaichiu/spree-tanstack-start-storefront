import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { CircleAlert, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'
import { confirmCheckoutPaymentAndCompleteOrder } from '@/lib/checkout/api/completion/checkout-completion.functions'
import type { ConfirmPaymentCheckoutNavigation } from '@/lib/checkout/utils/completion/confirm-payment-return'
import {
  buildConfirmCheckoutPaymentInputData,
  getConfirmPaymentExceptionNavigation,
  getConfirmPaymentResultNavigation,
} from '@/lib/checkout/utils/completion/confirm-payment-return'
import { getCheckoutCompletionErrorMessage } from '@/lib/checkout/utils/completion/checkout-completion-error'
import type { CheckoutPaymentReturnSearch } from '@/lib/checkout/utils/completion/payment-return'

export function CheckoutConfirmPaymentPage({
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
  const { redirectResult, session, sessionId, sessionResult } = paymentReturn
  const { t } = useMarket()
  const navigate = useNavigate()
  const confirmPaymentFn = useServerFn(confirmCheckoutPaymentAndCompleteOrder)
  const attemptedRef = useRef(false)
  const mountedRef = useRef(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (attemptedRef.current) {
      return
    }

    attemptedRef.current = true

    async function returnToCheckout(
      navigation: ConfirmPaymentCheckoutNavigation,
    ) {
      const fallbackMessage = getCheckoutCompletionErrorMessage({
        error: navigation.error,
        errorCode: navigation.errorCode,
        t,
      })

      try {
        await navigate({
          params: navigation.params,
          replace: true,
          search: navigation.search,
          to: navigation.to,
        })
      } catch {
        if (mountedRef.current) {
          setError(fallbackMessage)
        }
      }
    }

    async function confirmAndRedirect() {
      try {
        const result = await confirmPaymentFn({
          data: buildConfirmCheckoutPaymentInputData({
            cartId,
            country,
            locale,
            redirectResult,
            session,
            sessionId,
            sessionResult,
          }),
        })

        if (!mountedRef.current) {
          return
        }

        const navigation = getConfirmPaymentResultNavigation({
          cartId,
          country,
          locale,
          result,
        })

        if (navigation.kind === 'order_placed') {
          await navigate({
            params: navigation.params,
            replace: true,
            to: navigation.to,
          })
          return
        }

        await returnToCheckout(navigation)
      } catch (confirmError) {
        if (!mountedRef.current) {
          return
        }

        await returnToCheckout(
          getConfirmPaymentExceptionNavigation({
            cartId,
            country,
            error: confirmError,
            locale,
          }),
        )
      }
    }

    void confirmAndRedirect()
  }, [
    cartId,
    confirmPaymentFn,
    country,
    locale,
    navigate,
    redirectResult,
    session,
    sessionId,
    sessionResult,
    t,
  ])

  return (
    <section className="mx-auto flex w-full max-w-checkout flex-col items-center justify-center px-6 py-20 text-center lg:px-14">
      {error ? (
        <>
          <CircleAlert
            aria-hidden="true"
            className="h-8 w-8 text-destructive"
          />
          <h1 className="mt-5 text-2xl leading-tight font-normal text-foreground">
            {t('checkout.paymentConfirmationFailed')}
          </h1>
          <p className="text-sm leading-6 mt-3 text-muted-foreground">
            {error}
          </p>
          <a
            className={buttonClassName({
              className: 'mt-7 min-h-12 min-w-52 px-8',
              size: 'lg',
            })}
            href={`/${country}/${locale}/checkout/${cartId}`}
          >
            {t('checkout.returnToCheckout')}
          </a>
        </>
      ) : (
        <>
          <Loader2
            aria-hidden="true"
            className="h-8 w-8 animate-spin text-muted-foreground"
          />
          <h1 className="mt-5 text-2xl leading-tight font-normal text-foreground">
            {t('checkout.confirmingPayment')}
          </h1>
          <p className="text-sm leading-6 mt-3 text-muted-foreground">
            {t('checkout.confirmPaymentDescription')}
          </p>
        </>
      )}
    </section>
  )
}
