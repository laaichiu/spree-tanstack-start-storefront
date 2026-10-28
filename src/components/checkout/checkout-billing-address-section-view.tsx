import { RadioGroup, RadioOption } from '@/components/ui/radio'
import { cn } from '@/components/ui/utils'

import type {
  CheckoutBillingAddressSectionModel,
  CheckoutBillingAddressSectionSlots,
} from '../contracts/checkout'

export type {
  CheckoutBillingAddressSectionModel,
  CheckoutBillingAddressSectionSlots,
} from '../contracts/checkout'

export function CheckoutBillingAddressSectionView({
  model,
  onModeChange,
  slots,
}: {
  model: CheckoutBillingAddressSectionModel
  onModeChange: (
    mode: CheckoutBillingAddressSectionModel['billingMode'],
  ) => void
  slots: CheckoutBillingAddressSectionSlots
}) {
  const { billingMode, differentLabel, disabled, sameLabel, title } = model

  return (
    <div className="space-y-4">
      <h3 className="text-base md:text-lg font-normal text-foreground">
        {title}
      </h3>
      <RadioGroup
        className="overflow-hidden border border-border"
        disabled={disabled}
        onValueChange={(value) =>
          onModeChange(value === 'different' ? 'different' : 'same')
        }
        value={billingMode}
      >
        <RadioOption
          className={cn(
            'px-4 py-3',
            billingMode === 'same'
              ? 'bg-muted'
              : 'bg-background hover:bg-muted',
          )}
          label={sameLabel}
          value="same"
        />
        <RadioOption
          className={cn(
            'border-t border-border px-4 py-3',
            billingMode === 'different'
              ? 'bg-muted'
              : 'bg-background hover:bg-muted',
          )}
          label={differentLabel}
          value="different"
        />
      </RadioGroup>
      {billingMode === 'different' && slots.fields}
    </div>
  )
}
