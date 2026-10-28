import type { Ref } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type {
  CheckoutBillingAddressInput,
  CheckoutBillingAddressMode,
} from '@/lib/checkout/contracts'
import type { AddressRegionLabels } from '@/components/shared/address-region.types'

export type CheckoutBillingAddressSectionProps = {
  billingCountryIso: string
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: CheckoutBillingAddressMode
  billingStateAbbr: string
  billingStateName: string
  disabled: boolean
  fieldsRef?: Ref<HTMLDivElement>
  labels: AddressRegionLabels
  onAutofillSync?: () => void
  onBillingCountryChange: (countryIso: string) => void
  onBillingStateAbbrChange: (stateAbbr: string) => void
  onBillingStateNameChange: (stateName: string) => void
  onModeChange: (mode: CheckoutBillingAddressMode) => void
}

export type CheckoutBillingAddressFieldsProps = Pick<
  CheckoutBillingAddressSectionProps,
  | 'billingCountryIso'
  | 'billingForm'
  | 'billingStateAbbr'
  | 'billingStateName'
  | 'disabled'
  | 'fieldsRef'
  | 'labels'
  | 'onAutofillSync'
  | 'onBillingCountryChange'
  | 'onBillingStateAbbrChange'
  | 'onBillingStateNameChange'
>
