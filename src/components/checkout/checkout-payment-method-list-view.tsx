import { RadioGroup, RadioOption } from '@/components/ui/radio'
import { cn } from '@/components/ui/utils'

import type {
  CheckoutPaymentMethodListCapabilities,
  CheckoutPaymentMethodListModel,
} from '../contracts/checkout'

export type {
  CheckoutPaymentMethodListCapabilities,
  CheckoutPaymentMethodOption,
  CheckoutPaymentMethodListModel,
} from '../contracts/checkout'

export function CheckoutPaymentMethodListView({
  capabilities,
  model,
  onPaymentMethodChange,
}: {
  capabilities: CheckoutPaymentMethodListCapabilities
  model: CheckoutPaymentMethodListModel
  onPaymentMethodChange: (paymentMethodId: string) => void
}) {
  return (
    <RadioGroup
      className="overflow-hidden border border-border bg-muted"
      disabled={model.disabled}
      onValueChange={(methodId) => {
        if (typeof methodId !== 'string') {
          return
        }

        onPaymentMethodChange(methodId)
      }}
      value={model.selectedPaymentMethodId}
    >
      {model.methods.map((method, index) => (
        <div
          className={cn(index > 0 && 'border-t border-border')}
          key={method.id}
        >
          <RadioOption
            className="bg-muted px-4 py-3"
            description={method.description}
            label={method.name}
            value={method.id}
          />
          {model.selectedPaymentMethodId === method.id &&
            capabilities.renderPaymentMethodBody(method.id)}
        </div>
      ))}
    </RadioGroup>
  )
}
