import { useMarket } from '@/components/layout/market-provider'
import type {
  CheckoutPaymentMethod,
  CheckoutPaymentSession,
} from '@/lib/checkout/model/checkout'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/utils/payment/saved-payment-card'

import { CheckoutPaymentMethodError } from './checkout-payment-method-error'
import { CheckoutPaymentMethodSessionBody } from './checkout-payment-method-session-body'
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
    <div className="border-t border-border bg-background px-4 py-4">
      {method.sessionRequired && method.gatewayId === 'stripe' ? (
        <CheckoutPaymentMethodSessionBody
          clientSecret={clientSecret}
          disabled={disabled}
          isBusy={isBusy}
          onSavedPaymentProfileChange={onSavedPaymentProfileChange}
          onStripeElementCompleteChange={onStripeElementCompleteChange}
          onStripeElementReady={onStripeElementReady}
          onStripeReady={onStripeReady}
          paymentSession={paymentSession}
          savedPaymentCards={savedPaymentCards}
          selectedSavedPaymentProfileId={selectedSavedPaymentProfileId}
        />
      ) : method.sessionRequired ? (
        <div className="border border-destructive bg-muted px-4 py-3">
          <p className="text-sm leading-6 text-destructive">
            {t('checkout.unsupportedSessionPayment')}
          </p>
        </div>
      ) : (
        <div className="border border-border px-4 py-3">
          <p className="text-sm leading-6 text-muted-foreground">
            {disabled
              ? t('checkout.paymentStepDescription')
              : t('checkout.directPaymentReady')}
          </p>
        </div>
      )}

      <CheckoutPaymentMethodError
        clientSecret={clientSecret}
        disabled={disabled}
        error={paymentError}
        isBusy={isBusy}
        isRetryable={isPaymentSessionRetryable}
        method={method}
        onRetry={onRetryPaymentSession}
      />
    </div>
  )
}
