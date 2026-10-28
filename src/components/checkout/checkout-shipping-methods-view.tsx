import { RadioGroup, RadioOption } from '@/components/ui/radio'
import { cn } from '@/components/ui/utils'

import type { CheckoutShippingMethodsModel } from '../contracts/checkout'

export type { CheckoutShippingMethodsModel } from '../contracts/checkout'

export function CheckoutShippingMethodsView({
  model,
  onSelect,
}: {
  model: CheckoutShippingMethodsModel
  onSelect: (methodId: string) => void
}) {
  if (model.status === 'placeholder') {
    return (
      <div className="border border-border px-5 py-5">
        <p className="text-xs leading-6 text-muted-foreground">
          {model.placeholder}
        </p>
      </div>
    )
  }

  return (
    <RadioGroup
      className="overflow-hidden border border-border"
      data-testid="checkout-shipping-methods"
      disabled={model.disabled}
      onValueChange={(methodId) => {
        if (typeof methodId === 'string') {
          onSelect(methodId)
        }
      }}
      value={model.selectedMethodId ?? ''}
    >
      {model.methods.map((method, index) => (
        <RadioOption
          className={cn(
            'px-5 py-4',
            index > 0 && 'border-t border-border',
            method.isSelected ? 'bg-muted' : 'bg-background hover:bg-muted',
          )}
          key={method.identity}
          label={method.label}
          onClick={() => {
            if (!model.disabled && method.identity === model.selectedMethodId) {
              onSelect(method.identity)
            }
          }}
          trailing={method.price}
          value={method.identity}
        />
      ))}
    </RadioGroup>
  )
}
