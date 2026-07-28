import type { Ref } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { CheckoutBillingAddressInput } from '@/lib/checkout/validation/address'
import type { AddressRegionLabels } from '@/components/shared/address-region.types'

import type { BillingAddressMode } from './checkout-form'

export type CheckoutBillingAddressSectionProps = {
  billingCountryIso: string
  billingForm: UseFormReturn<CheckoutBillingAddressInput>
  billingMode: BillingAddressMode
  billingStateAbbr: string
  billingStateName: string
  disabled: boolean
  fieldsRef?: Ref<HTMLDivElement>
  labels: AddressRegionLabels
  onAutofillSync?: () => void
  onBillingCountryChange: (countryIso: string) => void
  onBillingStateAbbrChange: (stateAbbr: string) => void
  onBillingStateNameChange: (stateName: string) => void
  onModeChange: (mode: BillingAddressMode) => void
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
