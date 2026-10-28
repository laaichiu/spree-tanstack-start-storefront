import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/contracts'
import type { CheckoutPaymentSession } from '@/lib/checkout/utils/payment/payment-session-contract'
import {
  CheckoutPaymentFormSkeletonView,
  CheckoutPaymentSessionNoticeView,
} from '@/components/checkout/checkout-payment-session-state-view'
import { CheckoutPaymentSessionElementView } from '@/components/checkout/checkout-payment-session-element-view'

import { CheckoutSavedPaymentCards } from './checkout-saved-payment-cards'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { StripePaymentElement } from './stripe-payment-element'
import { useCheckoutPaymentSessionBodyController } from './use-checkout-payment-session-body-controller'

export type CheckoutPaymentMethodSessionBodyProps = {
  clientSecret?: string
  disabled: boolean
  isBusy: boolean
  onSavedPaymentProfileChange: (paymentProfileId: string | null) => void
  onStripeElementCompleteChange: (complete: boolean) => void
  onStripeElementReady: () => void
  onStripeReady: (handle: StripePaymentElementHandle) => void
  paymentSession: CheckoutPaymentSession | null
  savedPaymentCards: Array<CheckoutSavedPaymentCard>
  selectedSavedPaymentProfileId: string | null
}

export function CheckoutPaymentMethodSessionBody({
  clientSecret,
  disabled,
  isBusy,
  onSavedPaymentProfileChange,
  onStripeElementCompleteChange,
  onStripeElementReady,
  onStripeReady,
  paymentSession,
  savedPaymentCards,
  selectedSavedPaymentProfileId,
}: CheckoutPaymentMethodSessionBodyProps) {
  const { t } = useMarket()
  const {
    handleStripeElementCompleteChange,
    handleStripeElementReady,
    handleStripeReady,
    hasSelectedSavedPaymentCard,
    showPaymentFormSkeleton,
    showStripePaymentElement,
  } = useCheckoutPaymentSessionBodyController({
    clientSecret,
    disabled,
    isBusy,
    onStripeElementCompleteChange,
    onStripeElementReady,
    onStripeReady,
    paymentSession,
    selectedSavedPaymentProfileId,
  })

  if (clientSecret) {
    return (
      <>
        <CheckoutSavedPaymentCards
          cards={savedPaymentCards}
          disabled={disabled || isBusy}
          onSavedPaymentProfileChange={onSavedPaymentProfileChange}
          selectedPaymentProfileId={selectedSavedPaymentProfileId}
        />
        {hasSelectedSavedPaymentCard && (
          <CheckoutPaymentSessionNoticeView
            model={{
              message: t('checkout.savedPaymentMethodReady'),
              variant: 'card',
            }}
          />
        )}
        {!hasSelectedSavedPaymentCard && showStripePaymentElement && (
          <CheckoutPaymentSessionElementView
            isLoading={showPaymentFormSkeleton}
            slots={{
              loading: (
                <CheckoutPaymentFormSkeletonView
                  label={t('checkout.initializingPayment')}
                />
              ),
              payment: (
                <StripePaymentElement
                  clientSecret={clientSecret}
                  confirmPaymentFallbackMessage={t(
                    'checkout.stripeConfirmPaymentFailed',
                  )}
                  onCompleteChange={handleStripeElementCompleteChange}
                  onElementReady={handleStripeElementReady}
                  onReady={handleStripeReady}
                  stripeNotLoadedMessage={t('checkout.stripeNotLoaded')}
                />
              ),
            }}
          />
        )}
      </>
    )
  }

  if (disabled) {
    return (
      <CheckoutPaymentSessionNoticeView
        model={{
          message: t('checkout.paymentStepDescription'),
          variant: 'inline',
        }}
      />
    )
  }

  if (showPaymentFormSkeleton) {
    return (
      <CheckoutPaymentFormSkeletonView
        label={t('checkout.initializingPayment')}
      />
    )
  }

  return (
    <CheckoutPaymentSessionNoticeView
      model={{
        message: t('checkout.paymentSessionNotReady'),
        variant: 'inline',
      }}
    />
  )
}
