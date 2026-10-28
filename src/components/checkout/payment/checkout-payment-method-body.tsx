import { useMarket } from '@/components/layout/market-provider'
import type {
  CheckoutPaymentMethod,
  CheckoutSavedPaymentCard,
} from '@/lib/checkout/contracts'
import type { CheckoutPaymentSession } from '@/lib/checkout/utils/payment/payment-session-contract'
import {
  CheckoutPaymentMethodBodyView,
  CheckoutPaymentMethodNoticeView,
} from '@/components/checkout/checkout-payment-method-body-view'

import { CheckoutPaymentMethodError } from './checkout-payment-method-error'
import { CheckoutPaymentMethodSessionBodyLoader } from './checkout-payment-method-session-body-loader'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'

export function CheckoutPaymentMethodBody({
  clientSecret,
  disabled,
  isBusy,
  isPaymentSessionRetryable,
  method,
  onSavedPaymentProfileChange,
  onStripeElementCompleteChange,
  onStripeElementReady,
  onStripeReady,
  onRetryPaymentSession,
  paymentError,
  paymentSession,
  savedPaymentCards,
  selectedSavedPaymentProfileId,
}: {
  clientSecret?: string
  disabled: boolean
  isBusy: boolean
  isPaymentSessionRetryable: boolean
  method: CheckoutPaymentMethod
  onSavedPaymentProfileChange: (paymentProfileId: string | null) => void
  onStripeElementCompleteChange: (complete: boolean) => void
  onStripeElementReady: () => void
  onStripeReady: (handle: StripePaymentElementHandle) => void
  onRetryPaymentSession: () => void
  paymentError: string | null
  paymentSession: CheckoutPaymentSession | null
  savedPaymentCards: Array<CheckoutSavedPaymentCard>
  selectedSavedPaymentProfileId: string | null
}) {
  const { t } = useMarket()

  return (
    <CheckoutPaymentMethodBodyView
      slots={{
        content: (
          <>
            {method.sessionRequired && method.gatewayId === 'stripe' && (
              <CheckoutPaymentMethodSessionBodyLoader
                clientSecret={clientSecret}
                disabled={disabled}
                isBusy={isBusy}
                loadErrorLabel={t('checkout.paymentFormLoadFailed')}
                loadingLabel={t('checkout.initializingPayment')}
                onSavedPaymentProfileChange={onSavedPaymentProfileChange}
                onStripeElementCompleteChange={onStripeElementCompleteChange}
                onStripeElementReady={onStripeElementReady}
                onStripeReady={onStripeReady}
                paymentSession={paymentSession}
                retryLoadLabel={t('checkout.retryPaymentForm')}
                savedPaymentCards={savedPaymentCards}
                selectedSavedPaymentProfileId={selectedSavedPaymentProfileId}
              />
            )}
            {method.sessionRequired && method.gatewayId !== 'stripe' && (
              <CheckoutPaymentMethodNoticeView
                model={{
                  message: t('checkout.unsupportedSessionPayment'),
                  tone: 'error',
                }}
              />
            )}
            {!method.sessionRequired && (
              <CheckoutPaymentMethodNoticeView
                model={{
                  message: disabled
                    ? t('checkout.paymentStepDescription')
                    : t('checkout.directPaymentReady'),
                  tone: 'neutral',
                }}
              />
            )}
          </>
        ),
        error: (
          <CheckoutPaymentMethodError
            clientSecret={clientSecret}
            disabled={disabled}
            error={paymentError}
            isBusy={isBusy}
            isRetryable={isPaymentSessionRetryable}
            method={method}
            onRetry={onRetryPaymentSession}
          />
        ),
      }}
    />
  )
}
