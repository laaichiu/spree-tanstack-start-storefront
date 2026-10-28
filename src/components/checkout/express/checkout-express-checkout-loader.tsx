import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

import { CheckoutExpressCheckoutView } from '@/components/checkout/checkout-express-checkout-view'
import { CheckoutPaymentMethodErrorView } from '@/components/checkout/checkout-payment-method-error-view'
import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { getCheckoutExpressCheckoutState } from '@/lib/checkout/utils/express/express-checkout-state'
import { reportError } from '@/lib/observability/report-error'
import { isStripeConfigured } from '@/lib/stripe/client'

type ExpressCheckoutProps = { cart: CheckoutOrder }
type ExpressCheckoutModule = {
  CheckoutExpressCheckout: ComponentType<ExpressCheckoutProps>
}

const loadExpressCheckout = () => import('./checkout-express-checkout')

export function CheckoutExpressCheckoutLoader({
  cart,
  load = loadExpressCheckout,
}: ExpressCheckoutProps & { load?: () => Promise<ExpressCheckoutModule> }) {
  const { t } = useMarket()
  const [ExpressCheckout, setExpressCheckout] =
    useState<ComponentType<ExpressCheckoutProps> | null>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const eligible =
    getCheckoutExpressCheckoutState({
      amountDue: cart.amountDue?.amount ?? null,
      currencyCode: cart.currencyCode,
      hasWalletAction: true,
      paymentMethods: cart.paymentMethods,
      stripeConfigured: isStripeConfigured,
    }).status === 'ready'

  useEffect(() => {
    if (!eligible) return

    let cancelled = false
    setHasLoadError(false)
    void load().then(
      (module) => {
        if (!cancelled) setExpressCheckout(() => module.CheckoutExpressCheckout)
      },
      (error: unknown) => {
        if (cancelled) return
        reportError({ context: 'checkout.expressCheckoutLoad', error })
        setHasLoadError(true)
      },
    )
    return () => {
      cancelled = true
    }
  }, [eligible, load, retryCount])

  if (!eligible) return null
  if (hasLoadError) {
    return (
      <CheckoutPaymentMethodErrorView
        model={{
          error: t('checkout.expressCheckoutUnavailable'),
          isRetryable: true,
          retryDisabled: false,
          retryLabel: t('checkout.retryPaymentSetup'),
        }}
        onRetry={() => {
          setHasLoadError(false)
          setRetryCount((count) => count + 1)
        }}
      />
    )
  }
  if (ExpressCheckout) return <ExpressCheckout cart={cart} />

  return (
    <CheckoutExpressCheckoutView
      model={{
        error: null,
        isLoading: true,
        isProcessing: false,
        isReady: false,
        orLabel: t('checkout.or'),
        processingLabel: t('checkout.finalizingExpressCheckout'),
        title: t('checkout.expressCheckout'),
      }}
      slots={{ paymentElement: null }}
    />
  )
}
