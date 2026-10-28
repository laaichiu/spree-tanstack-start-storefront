import { forwardRef, useImperativeHandle } from 'react'
import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CustomerCreditCard } from '@/lib/account/contracts'
import type { CheckoutOrder } from '@/lib/checkout/contracts'
import { CheckoutPaymentSectionView } from '@/components/checkout/checkout-payment-section-view'

import { CheckoutPaymentMethodContent } from './checkout-payment-method-content'
import { useCheckoutPaymentSection } from './use-checkout-payment-section'
import type { CheckoutPaymentSubmitResult } from '@/lib/checkout/client/use-checkout-payment-submit'

export type CheckoutPaymentSectionHandle = {
  ownerKey: string
  submit: () => Promise<CheckoutPaymentSubmitResult>
}

type CheckoutPaymentSectionProps = {
  billingAddressSection?: ReactNode
  cart: CheckoutOrder
  controlsDisabled?: boolean
  errors?: string[]
  id?: string
  onBusyChange?: (busy: boolean) => void
  onPaymentSubmitReadyChange?: (ready: boolean) => void
  onSetupPendingChange?: (pending: boolean) => void
  savedPaymentCards?: Array<CustomerCreditCard>
  shippingReady: boolean
}

export const CheckoutPaymentSection = forwardRef<
  CheckoutPaymentSectionHandle,
  CheckoutPaymentSectionProps
>(function CheckoutPaymentSectionImpl(
  {
    billingAddressSection,
    cart,
    controlsDisabled = false,
    errors,
    id,
    onBusyChange,
    onPaymentSubmitReadyChange,
    onSetupPendingChange,
    savedPaymentCards = [],
    shippingReady,
  },
  ref,
) {
  const { t } = useMarket()
  const payment = useCheckoutPaymentSection({
    cart,
    onBusyChange,
    onPaymentSubmitReadyChange,
    onSetupPendingChange,
    savedPaymentCards,
    shippingReady,
  })
  const visiblePaymentError =
    payment.paymentError && !errors?.includes(payment.paymentError)
      ? payment.paymentError
      : null

  useImperativeHandle(
    ref,
    () => ({
      ownerKey: payment.paymentSubmissionContextKey,
      submit: payment.submitPayment,
    }),
    [payment.paymentSubmissionContextKey, payment.submitPayment],
  )

  return (
    <CheckoutPaymentSectionView
      model={{
        description: t('checkout.paymentSecurityDescription'),
        errors,
        hasPaymentMethods: cart.paymentMethods.length > 0,
        id,
        noPaymentMethodsDescription: t('checkout.paymentStepDescription'),
        title: t('checkout.paymentStep'),
      }}
      slots={{
        billingAddress: billingAddressSection,
        payment: (
          <CheckoutPaymentMethodContent
            cart={cart}
            controlsDisabled={controlsDisabled}
            paymentError={visiblePaymentError}
            payment={payment}
          />
        ),
      }}
    />
  )
})
