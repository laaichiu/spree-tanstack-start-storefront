import { forwardRef, useImperativeHandle } from 'react'
import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CustomerCreditCard } from '@/lib/account/model/customer-credit-card'
import type { CheckoutOrder } from '@/lib/checkout/model/checkout'

import { CheckoutPaymentMethodContent } from './checkout-payment-method-content'
import { useCheckoutPaymentSection } from './use-checkout-payment-section'
import type { CheckoutPaymentSubmitResult } from './use-checkout-payment-submit'

export type CheckoutPaymentSectionHandle = {
  submit: () => Promise<CheckoutPaymentSubmitResult>
}

type CheckoutPaymentSectionProps = {
  billingAddressSection?: ReactNode
  cart: CheckoutOrder
  controlsDisabled?: boolean
  errors?: string[]
  id?: string
  onBusyChange?: (busy: boolean) => void
  onReadyChange?: (ready: boolean) => void
  onSetupPendingChange?: (pending: boolean) => void
  savedPaymentCards?: Array<CustomerCreditCard>
  shippingReady: boolean
}

function CheckoutPaymentSectionHeader() {
  const { t } = useMarket()

  return (
    <div>
      <h2 className="text-2xl leading-none font-normal text-foreground">
        {t('checkout.paymentStep')}
      </h2>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">
        {t('checkout.paymentSecurityDescription')}
      </p>
    </div>
  )
}

function CheckoutPaymentSectionErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null
  }

  return (
    <div className="border border-destructive bg-muted px-4 py-3">
      {errors.map((error, index) => (
        <p
          className="text-sm leading-6 text-destructive"
          key={`${error}:${index}`}
        >
          {error}
        </p>
      ))}
    </div>
  )
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
    onReadyChange,
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
    onReadyChange,
    onSetupPendingChange,
    savedPaymentCards,
    shippingReady,
  })

  useImperativeHandle(
    ref,
    () => ({
      submit: payment.submitPayment,
    }),
    [payment.submitPayment],
  )

  if (cart.paymentMethods.length === 0) {
    return (
      <section className="space-y-5 scroll-mt-8" id={id}>
        <CheckoutPaymentSectionHeader />
        <CheckoutPaymentSectionErrors errors={errors} />
        <div className="border border-border px-5 py-5">
          <p className="text-sm leading-6 text-muted-foreground">
            {t('checkout.paymentStepDescription')}
          </p>
        </div>
        {billingAddressSection}
      </section>
    )
  }

  return (
    <section className="space-y-5 scroll-mt-8" id={id}>
      <CheckoutPaymentSectionHeader />

      <CheckoutPaymentSectionErrors errors={errors} />

      <CheckoutPaymentMethodContent
        cart={cart}
        controlsDisabled={controlsDisabled}
        payment={payment}
      />
      {billingAddressSection}
    </section>
  )
})
