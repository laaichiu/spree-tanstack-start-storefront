import { MapPin } from 'lucide-react'

import { RadioGroup, RadioOption } from '@/components/ui/radio'
import type { CustomerAddress } from '@/lib/account/model/customer-address'
import { getAddressLines } from '@/lib/account/model/customer-address'
import { cn } from '@/lib/utils'
import { useMarket } from '@/components/layout/market-provider'

const MANUAL_ADDRESS_VALUE = 'manual'

type CheckoutSavedAddressesProps = {
  addresses: Array<CustomerAddress>
  disabled?: boolean
  onSelectAddress: (address: CustomerAddress) => void
  onUseManualAddress: () => void
  selectedAddressId: string | null
}

function formatAddressDescription(address: CustomerAddress) {
  return getAddressLines(address).join(', ')
}

export function CheckoutSavedAddresses({
  addresses,
  disabled,
  onSelectAddress,
  onUseManualAddress,
  selectedAddressId,
}: CheckoutSavedAddressesProps) {
  const { t } = useMarket()

  if (!addresses.length) {
    return null
  }

  return (
    <div className="space-y-3" data-checkout-saved-addresses="">
      <div className="flex items-center gap-2 text-sm leading-4 font-normal tracking-wider text-muted-foreground uppercase">
        <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
        {t('checkout.savedAddresses')}
      </div>
      <RadioGroup
        className="overflow-hidden border border-border"
        disabled={disabled}
        onValueChange={(value) => {
          if (value === MANUAL_ADDRESS_VALUE) {
            onUseManualAddress()
            return
          }

          const address = addresses.find((candidate) => candidate.id === value)

          if (address) {
            onSelectAddress(address)
          }
        }}
        value={selectedAddressId ?? MANUAL_ADDRESS_VALUE}
      >
        {addresses.map((address, index) => (
          <RadioOption
            className={cn(
              'px-4 py-4',
              index > 0 ? 'border-t border-border' : null,
            )}
            description={formatAddressDescription(address)}
            key={address.id}
            label={address.fullName || t('checkout.savedAddress')}
            value={address.id}
          />
        ))}
        <RadioOption
          className="border-t border-border px-4 py-4"
          label={t('checkout.useDifferentDeliveryAddress')}
          value={MANUAL_ADDRESS_VALUE}
        />
      </RadioGroup>
    </div>
  )
}
