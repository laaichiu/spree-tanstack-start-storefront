import type { ReactNode } from 'react'

import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import { CheckoutPaymentMethodListView } from '@/components/checkout/checkout-payment-method-list-view'

export function CheckoutPaymentMethodList({
  disabled,
  methods,
  onPaymentMethodChange,
  renderPaymentMethodBody,
  selectedPaymentMethodId,
}: {
  disabled: boolean
  methods: Array<CheckoutPaymentMethod>
  onPaymentMethodChange: (paymentMethodId: string) => void
  renderPaymentMethodBody: (method: CheckoutPaymentMethod) => ReactNode
  selectedPaymentMethodId: string
}) {
  return (
    <CheckoutPaymentMethodListView
      capabilities={{
        renderPaymentMethodBody: (paymentMethodId) => {
          const method = methods.find(({ id }) => id === paymentMethodId)

          if (!method) {
            return null
          }

          return renderPaymentMethodBody(method)
        },
      }}
      model={{
        disabled,
        methods: methods.map(({ description, id, name }) => ({
          description,
          id,
          name,
        })),
        selectedPaymentMethodId,
      }}
      onPaymentMethodChange={onPaymentMethodChange}
    />
  )
}
