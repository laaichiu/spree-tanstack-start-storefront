import { useCallback, useEffect, useMemo, useState } from 'react'

import { getCheckoutPaymentMethodSelection } from '@/lib/checkout/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

export function useCheckoutPaymentMethodSelection({
  paymentMethods,
  resetPaymentSession,
}: {
  paymentMethods: Array<CheckoutPaymentMethod>
  resetPaymentSession: () => void
}) {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(
    () =>
      getCheckoutPaymentMethodSelection({
        paymentMethods,
        selectedPaymentMethodId: '',
      }).methodId,
  )
  const selectedPaymentMethod = useMemo<CheckoutPaymentMethod | null>(
    () =>
      getCheckoutPaymentMethodSelection({
        paymentMethods,
        selectedPaymentMethodId,
      }).method,
    [paymentMethods, selectedPaymentMethodId],
  )

  useEffect(() => {
    const selection = getCheckoutPaymentMethodSelection({
      paymentMethods,
      selectedPaymentMethodId,
    })

    if (selection.methodId === selectedPaymentMethodId) {
      return
    }

    setSelectedPaymentMethodId(selection.methodId)
  }, [paymentMethods, selectedPaymentMethodId])

  const handlePaymentMethodChange = useCallback(
    (methodId: string) => {
      setSelectedPaymentMethodId(methodId)
      resetPaymentSession()
    },
    [resetPaymentSession],
  )

  return {
    handlePaymentMethodChange,
    selectedPaymentMethod,
    selectedPaymentMethodId,
  }
}
