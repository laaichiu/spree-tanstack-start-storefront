import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { CheckoutPaymentMethodBody } from './checkout-payment-method-body'
import { CheckoutPaymentMethodList } from './checkout-payment-method-list'
import type { useCheckoutPaymentSection } from './use-checkout-payment-section'

type CheckoutPaymentMethodContentProps = {
  cart: CheckoutOrder
  controlsDisabled: boolean
  paymentError: string | null
  payment: ReturnType<typeof useCheckoutPaymentSection>
}

export function CheckoutPaymentMethodContent({
  cart,
  controlsDisabled,
  paymentError,
  payment,
}: CheckoutPaymentMethodContentProps) {
  return (
    <CheckoutPaymentMethodList
      disabled={controlsDisabled || payment.isBusy}
      methods={cart.paymentMethods}
      onPaymentMethodChange={payment.handlePaymentMethodChange}
      renderPaymentMethodBody={(method) => (
        <CheckoutPaymentMethodBody
          clientSecret={payment.clientSecret}
          disabled={controlsDisabled}
          isBusy={payment.isPaymentBodyBusy}
          isPaymentSessionRetryable={payment.isPaymentSessionRetryable}
          method={method}
          onSavedPaymentProfileChange={payment.handleSavedPaymentProfileChange}
          onStripeElementCompleteChange={
            payment.handleStripeElementCompleteChange
          }
          onStripeElementReady={payment.handleStripeElementReady}
          onStripeReady={payment.handleStripeReady}
          onRetryPaymentSession={payment.retryPaymentSession}
          paymentError={paymentError}
          paymentSession={payment.paymentSession}
          savedPaymentCards={payment.savedStripePaymentCards}
          selectedSavedPaymentProfileId={
            payment.selectedSavedPaymentProfileIdForSession
          }
        />
      )}
      selectedPaymentMethodId={payment.selectedPaymentMethod?.id ?? ''}
    />
  )
}
