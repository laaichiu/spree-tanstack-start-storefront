import type { ComponentPropsWithoutRef, Ref } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CartShippingRate } from '@/lib/cart/model/cart'
import type { CheckoutAddressInput } from '@/lib/checkout/validation/address'
import type { AddressRegionLabels } from '@/components/shared/address-region.types'

type CheckoutDeliveryFormEventProps = Pick<
  ComponentPropsWithoutRef<'form'>,
  | 'onBlurCapture'
  | 'onChangeCapture'
  | 'onClickCapture'
  | 'onFocusCapture'
  | 'onInputCapture'
  | 'onPointerDownCapture'
  | 'onSubmit'
>

export type CheckoutContactSectionProps = {
  accountLoginHref: string
  addressErrors?: string[]
  authenticatedCustomerEmail: string | null
  deliveryForm: UseFormReturn<CheckoutAddressInput>
}

export type CheckoutDeliveryAddressFieldsProps = {
  countryIso: string
  deliveryForm: UseFormReturn<CheckoutAddressInput>
  isCheckoutPending: boolean
  isCheckoutSubmitting: boolean
  labels: AddressRegionLabels
  onCountryChange: (countryIso: string) => void
  onRegionBlur: () => void
  onSelectSavedAddress: (address: CustomerAddress) => void
  onStateAbbrChange: (stateAbbr: string) => void
  onStateNameChange: (stateName: string) => void
  onUseManualAddress: () => void
  savedAddresses: Array<CustomerAddress>
  selectedSavedAddressId: string | null
  stateAbbr: string
  stateName: string
}

export type CheckoutShippingMethodSectionProps = {
  onSelectShippingRate: (rate: CartShippingRate) => void
  selectedShippingRateId: string
  shippingDisabled: boolean
  shippingErrors?: string[]
  shippingMethodsUpdating: boolean
  shippingPlaceholder: string
  shippingRates: Array<CartShippingRate>
}

export type CheckoutDeliverySectionProps = CheckoutDeliveryFormEventProps & {
  address: CheckoutDeliveryAddressFieldsProps
  contact: CheckoutContactSectionProps
  formRef?: Ref<HTMLFormElement>
  shipping: CheckoutShippingMethodSectionProps
}
