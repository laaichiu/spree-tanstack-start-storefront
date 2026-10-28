import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CustomerCreditCard } from '@/lib/account/contracts'
import {
  getCheckoutSavedPaymentCards,
  getDefaultCheckoutSavedPaymentCard,
} from '@/lib/checkout/contracts'
import type {
  CheckoutPaymentMethod,
  CheckoutSavedPaymentCard,
} from '@/lib/checkout/contracts'
import { getCheckoutSavedStripePaymentMethodId } from '@/lib/checkout/utils/payment/payment-session'

export function useCheckoutSavedPaymentCardSelection({
  paymentMethod,
  resetPaymentSession,
  savedPaymentCards,
}: {
  paymentMethod: CheckoutPaymentMethod | null
  resetPaymentSession: () => void
  savedPaymentCards: Array<CustomerCreditCard>
}) {
  const savedStripePaymentCards = useMemo<Array<CheckoutSavedPaymentCard>>(
    () => getCheckoutSavedPaymentCards(savedPaymentCards),
    [savedPaymentCards],
  )
  const [selectedSavedPaymentProfileId, setSelectedSavedPaymentProfileId] =
    useState<string | null>(
      () =>
        getDefaultCheckoutSavedPaymentCard(savedPaymentCards)
          ?.gatewayPaymentProfileId ?? null,
    )
  const selectedSavedPaymentProfileIdForSession =
    getCheckoutSavedStripePaymentMethodId({
      paymentMethod,
      savedPaymentCards: savedStripePaymentCards,
      selectedPaymentProfileId: selectedSavedPaymentProfileId,
    })

  useEffect(() => {
    if (!selectedSavedPaymentProfileId) {
      return
    }

    if (
      getCheckoutSavedStripePaymentMethodId({
        paymentMethod,
        savedPaymentCards: savedStripePaymentCards,
        selectedPaymentProfileId: selectedSavedPaymentProfileId,
      })
    ) {
      return
    }

    setSelectedSavedPaymentProfileId(
      getDefaultCheckoutSavedPaymentCard(savedStripePaymentCards)
        ?.gatewayPaymentProfileId ?? null,
    )
    resetPaymentSession()
  }, [
    paymentMethod,
    resetPaymentSession,
    savedStripePaymentCards,
    selectedSavedPaymentProfileId,
  ])

  const handleSavedPaymentProfileChange = useCallback(
    (paymentProfileId: string | null) => {
      setSelectedSavedPaymentProfileId(paymentProfileId)
      resetPaymentSession()
    },
    [resetPaymentSession],
  )

  return {
    handleSavedPaymentProfileChange,
    savedStripePaymentCards,
    selectedSavedPaymentProfileId,
    selectedSavedPaymentProfileIdForSession,
  }
}
