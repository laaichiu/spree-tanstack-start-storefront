import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'
import { getCheckoutSavedStripePaymentMethodId } from '@/lib/checkout/utils/payment/payment-session'
import {
  getCheckoutSavedPaymentCards,
  getDefaultCheckoutSavedPaymentCard,
} from '@/lib/checkout/utils/payment/saved-payment-card'

export function useCheckoutPaymentSelection({
  paymentMethods,
  resetPaymentSession,
  savedPaymentCards,
}: {
  paymentMethods: Array<CheckoutPaymentMethod>
  resetPaymentSession: () => void
  savedPaymentCards: Array<CustomerCreditCard>
}) {
  const savedStripePaymentCards = useMemo(
    () => getCheckoutSavedPaymentCards(savedPaymentCards),
    [savedPaymentCards],
  )
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(
    () => paymentMethods[0]?.id ?? '',
  )
  const [selectedSavedPaymentProfileId, setSelectedSavedPaymentProfileId] =
    useState<string | null>(
      () =>
        getDefaultCheckoutSavedPaymentCard(savedPaymentCards)
          ?.gatewayPaymentProfileId ?? null,
    )
  const selectedPaymentMethod = useMemo<CheckoutPaymentMethod | null>(
    () =>
      paymentMethods.find((method) => method.id === selectedPaymentMethodId) ??
      paymentMethods.at(0) ??
      null,
    [paymentMethods, selectedPaymentMethodId],
  )
  const selectedSavedPaymentProfileIdForSession =
    getCheckoutSavedStripePaymentMethodId({
      paymentMethod: selectedPaymentMethod,
      savedPaymentCards: savedStripePaymentCards,
      selectedPaymentProfileId: selectedSavedPaymentProfileId,
    })

  useEffect(() => {
    if (
      selectedPaymentMethodId &&
      paymentMethods.some((method) => method.id === selectedPaymentMethodId)
    ) {
      return
    }

    setSelectedPaymentMethodId(paymentMethods[0]?.id ?? '')
  }, [paymentMethods, selectedPaymentMethodId])

  useEffect(() => {
    if (!selectedSavedPaymentProfileId) {
      return
    }

    if (
      getCheckoutSavedStripePaymentMethodId({
        paymentMethod: selectedPaymentMethod,
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
    resetPaymentSession,
    savedStripePaymentCards,
    selectedPaymentMethod,
    selectedSavedPaymentProfileId,
  ])

  const handleSavedPaymentProfileChange = useCallback(
    (paymentProfileId: string | null) => {
      setSelectedSavedPaymentProfileId(paymentProfileId)
      resetPaymentSession()
    },
    [resetPaymentSession],
  )
  const handlePaymentMethodChange = useCallback(
    (methodId: string) => {
      setSelectedPaymentMethodId(methodId)
      resetPaymentSession()
    },
    [resetPaymentSession],
  )

  return {
    handlePaymentMethodChange,
    handleSavedPaymentProfileChange,
    savedStripePaymentCards,
    selectedPaymentMethod,
    selectedPaymentMethodId,
    selectedSavedPaymentProfileId,
    selectedSavedPaymentProfileIdForSession,
  }
}
