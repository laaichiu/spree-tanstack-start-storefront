import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

import { CheckoutPaymentMethodErrorView } from '@/components/checkout/checkout-payment-method-error-view'
import { CheckoutPaymentFormSkeletonView } from '@/components/checkout/checkout-payment-session-state-view'
import { reportError } from '@/lib/observability/report-error'

import type { CheckoutPaymentMethodSessionBodyProps } from './checkout-payment-method-session-body'

export type CheckoutPaymentMethodSessionBodyModule = {
  CheckoutPaymentMethodSessionBody: ComponentType<CheckoutPaymentMethodSessionBodyProps>
}

type CheckoutPaymentMethodSessionBodyLoaderProps =
  CheckoutPaymentMethodSessionBodyProps & {
    loadErrorLabel: string
    loadingLabel: string
    loadSessionBody?: () => Promise<CheckoutPaymentMethodSessionBodyModule>
    retryLoadLabel: string
  }

const loadCheckoutPaymentMethodSessionBody = () =>
  import('./checkout-payment-method-session-body')

export function CheckoutPaymentMethodSessionBodyLoader({
  loadingLabel,
  loadSessionBody = loadCheckoutPaymentMethodSessionBody,
  loadErrorLabel,
  retryLoadLabel,
  ...props
}: CheckoutPaymentMethodSessionBodyLoaderProps) {
  const [SessionBody, setSessionBody] =
    useState<ComponentType<CheckoutPaymentMethodSessionBodyProps> | null>(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setHasLoadError(false)

    void loadSessionBody().then(
      (module) => {
        if (!cancelled) {
          setSessionBody(() => module.CheckoutPaymentMethodSessionBody)
        }
      },
      (error: unknown) => {
        if (cancelled) {
          return
        }

        reportError({
          context: 'checkout.paymentMethodSessionBody',
          error,
        })
        setHasLoadError(true)
      },
    )

    return () => {
      cancelled = true
    }
  }, [loadSessionBody, retryCount])

  function retrySessionBodyLoad() {
    setSessionBody(null)
    setHasLoadError(false)
    setRetryCount((count) => count + 1)
  }

  if (hasLoadError) {
    return (
      <CheckoutPaymentMethodErrorView
        model={{
          error: loadErrorLabel,
          isRetryable: true,
          retryDisabled: props.disabled,
          retryLabel: retryLoadLabel,
        }}
        onRetry={retrySessionBodyLoad}
      />
    )
  }

  if (!SessionBody) {
    return <CheckoutPaymentFormSkeletonView label={loadingLabel} />
  }

  return <SessionBody {...props} />
}
