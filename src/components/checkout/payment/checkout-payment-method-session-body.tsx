import { useCallback, useEffect, useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutPaymentSession } from '@/lib/checkout/model/checkout'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/utils/payment/saved-payment-card'
import { cn } from '@/lib/utils'

import { CheckoutSavedPaymentCards } from './checkout-saved-payment-cards'
import type { StripePaymentElementHandle } from './stripe-payment-element.types'
import { StripePaymentElement } from './stripe-payment-element'

function CheckoutPaymentFormSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="space-y-4 py-1"
      role="status"
    >
      <div className="grid grid-cols-2 gap-3">
        <span className="h-12 animate-pulse rounded-sm border border-border bg-muted" />
        <span className="h-12 animate-pulse rounded-sm border border-border bg-muted" />
      </div>
      <div className="space-y-3">
        <span className="block h-4 w-40 animate-pulse rounded-sm bg-muted" />
        <span className="block h-12 animate-pulse rounded-sm border border-border bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <span className="h-12 animate-pulse rounded-sm border border-border bg-muted" />
          <span className="h-12 animate-pulse rounded-sm border border-border bg-muted" />
        </div>
        <span className="block h-12 animate-pulse rounded-sm border border-border bg-muted" />
      </div>
    </div>
  )
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
}: {
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
}) {
  const { t } = useMarket()
  const [isStripePaymentElementReady, setIsStripePaymentElementReady] =
    useState(false)
  const hasSelectedSavedPaymentCard = Boolean(selectedSavedPaymentProfileId)
  const showStripePaymentElement =
    Boolean(clientSecret) && !hasSelectedSavedPaymentCard
  const showPaymentFormSkeleton =
    !disabled &&
    (showStripePaymentElement
      ? !isStripePaymentElementReady
      : isBusy || !paymentSession)

  useEffect(() => {
    setIsStripePaymentElementReady(false)
  }, [clientSecret])

  const handleStripeElementReady = useCallback(() => {
    setIsStripePaymentElementReady(true)
    onStripeElementReady()
  }, [onStripeElementReady])

  if (clientSecret) {
    return (
      <>
        <CheckoutSavedPaymentCards
          cards={savedPaymentCards}
          disabled={disabled || isBusy}
          onSavedPaymentProfileChange={onSavedPaymentProfileChange}
          selectedPaymentProfileId={selectedSavedPaymentProfileId}
        />
        {hasSelectedSavedPaymentCard ? (
          <div className="border border-border px-4 py-3">
            <p className="text-sm leading-6 text-muted-foreground">
              {t('checkout.savedPaymentMethodReady')}
            </p>
          </div>
        ) : showStripePaymentElement ? (
          <div className="relative">
            {showPaymentFormSkeleton ? (
              <CheckoutPaymentFormSkeleton
                label={t('checkout.initializingPayment')}
              />
            ) : null}
            <div
              aria-hidden={showPaymentFormSkeleton}
              className={cn(
                showPaymentFormSkeleton
                  ? 'pointer-events-none absolute inset-x-0 top-0 opacity-0'
                  : null,
              )}
            >
              <StripePaymentElement
                clientSecret={clientSecret}
                confirmPaymentFallbackMessage={t(
                  'checkout.stripeConfirmPaymentFailed',
                )}
                onCompleteChange={onStripeElementCompleteChange}
                onElementReady={handleStripeElementReady}
                onReady={onStripeReady}
                stripeNotLoadedMessage={t('checkout.stripeNotLoaded')}
              />
            </div>
          </div>
        ) : null}
      </>
    )
  }

  if (disabled) {
    return (
      <div className="py-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {t('checkout.paymentStepDescription')}
        </p>
      </div>
    )
  }

  if (showPaymentFormSkeleton) {
    return (
      <CheckoutPaymentFormSkeleton label={t('checkout.initializingPayment')} />
    )
  }

  return (
    <div className="py-3">
      <p className="text-sm leading-6 text-muted-foreground">
        {t('checkout.paymentSessionNotReady')}
      </p>
    </div>
  )
}
