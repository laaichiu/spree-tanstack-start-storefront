import { MapPin } from 'lucide-react'

import { RadioGroup, RadioOption } from '@/components/ui/radio'
import { cn } from '@/components/ui/utils'

import type {
  CheckoutSavedAddressesActions,
  CheckoutSavedAddressesModel,
} from '../contracts/checkout'

export type {
  CheckoutSavedAddressesActions,
  CheckoutSavedAddressesModel,
} from '../contracts/checkout'

const MANUAL_ADDRESS_VALUE = 'manual'

export function CheckoutSavedAddressesView({
  actions,
  model,
}: {
  actions: CheckoutSavedAddressesActions
  model: CheckoutSavedAddressesModel
}) {
  if (!model.addresses.length) {
    return null
  }

  return (
    <div className="space-y-3" data-checkout-saved-addresses="">
      <div className="flex items-center gap-2 text-xs leading-4 font-normal tracking-wider text-muted-foreground uppercase">
        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
        {model.title}
      </div>
      <RadioGroup
        className="overflow-hidden border border-border"
        disabled={model.disabled}
        onValueChange={(value) => {
          if (value === MANUAL_ADDRESS_VALUE) {
            actions.useManualAddress()
            return
          }

          if (typeof value === 'string') {
            actions.selectAddress(value)
          }
        }}
        value={model.selectedAddressId ?? MANUAL_ADDRESS_VALUE}
      >
        {model.addresses.map((address, index) => (
          <RadioOption
            className={cn('px-4 py-4', index > 0 && 'border-t border-border')}
            description={address.description}
            key={address.id}
            label={address.label}
            value={address.id}
          />
        ))}
        <RadioOption
          className="border-t border-border px-4 py-4"
          label={model.manualAddressLabel}
          value={MANUAL_ADDRESS_VALUE}
        />
      </RadioGroup>
    </div>
  )
}
