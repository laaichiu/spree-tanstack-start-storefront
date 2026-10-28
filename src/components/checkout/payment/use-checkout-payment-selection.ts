import type { CustomerCreditCard } from '@/lib/account/contracts'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'

import { useCheckoutPaymentMethodSelection } from './use-checkout-payment-method-selection'
import { useCheckoutSavedPaymentCardSelection } from './use-checkout-saved-payment-card-selection'

export function useCheckoutPaymentSelection({
  paymentMethods,
  resetPaymentSession,
  savedPaymentCards,
}: {
  paymentMethods: Array<CheckoutPaymentMethod>
  resetPaymentSession: () => void
  savedPaymentCards: Array<CustomerCreditCard>
}) {
  const paymentMethodSelection = useCheckoutPaymentMethodSelection({
    paymentMethods,
    resetPaymentSession,
  })
  const savedPaymentCardSelection = useCheckoutSavedPaymentCardSelection({
    paymentMethod: paymentMethodSelection.selectedPaymentMethod,
    resetPaymentSession,
    savedPaymentCards,
  })

  return {
    ...paymentMethodSelection,
    ...savedPaymentCardSelection,
  }
}
