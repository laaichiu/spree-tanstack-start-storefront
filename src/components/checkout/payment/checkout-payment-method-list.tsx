import type { ReactNode } from 'react'

import { RadioGroup, RadioOption } from '@/components/ui/radio'
import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'
import { cn } from '@/lib/utils'

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
    <RadioGroup
      className="overflow-hidden border border-border bg-muted"
      disabled={disabled}
      onValueChange={(methodId) => {
        if (typeof methodId !== 'string') {
          return
        }

        onPaymentMethodChange(methodId)
      }}
      value={selectedPaymentMethodId}
    >
      {methods.map((method, index) => (
        <div
          className={cn(index > 0 ? 'border-t border-border' : null)}
          key={method.id}
        >
          <RadioOption
            className="bg-muted px-4 py-3"
            description={method.description}
            label={method.name}
            value={method.id}
          />
          {selectedPaymentMethodId === method.id
            ? renderPaymentMethodBody(method)
            : null}
        </div>
      ))}
    </RadioGroup>
  )
}
