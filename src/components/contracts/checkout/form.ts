import type { ReactNode } from 'react'
import type { CheckoutBillingAddressMode } from '@/lib/checkout/contracts'

export type CheckoutSectionModel = {
  description?: string
  errors?: readonly string[]
  id?: string
  title: string
}

export type CheckoutSectionSlots = {
  action?: ReactNode
  content: ReactNode
}

export type CheckoutBillingAddressSectionModel = {
  billingMode: CheckoutBillingAddressMode
  differentLabel: string
  disabled: boolean
  sameLabel: string
  title: string
}

export type CheckoutBillingAddressSectionSlots = {
  fields: ReactNode
}

export type CheckoutBillingAddressFieldsSlots = {
  fields: ReactNode
}

export type CheckoutContactFieldModel = {
  disabled: boolean
  error?: string
  label: string
  placeholder: string
}

export type CheckoutContactSectionModel = {
  contact: CheckoutContactFieldModel
  section: CheckoutSectionModel
}

export type CheckoutDeliverySectionSlots = {
  address: ReactNode
  shipping: ReactNode
}

export type CheckoutDeliveryFormSlots = {
  contact: ReactNode
  delivery: ReactNode
}

export type CheckoutPostalAddressLayoutSlots = {
  address1: ReactNode
  address2: ReactNode
  city: ReactNode
  company: ReactNode
  country: ReactNode
  firstName: ReactNode
  lastName: ReactNode
  phone: ReactNode
  postalCode: ReactNode
  state: ReactNode
}

export type CheckoutDeliveryAddressFieldsModel = {
  showManualAddressForm: boolean
}

export type CheckoutDeliveryAddressFieldsSlots = {
  manual: ReactNode
  saved: ReactNode
}
