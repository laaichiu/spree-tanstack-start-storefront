import type { CustomerAddress } from '@/lib/account/model/customer-address'
import type { CheckoutAddress } from '@/lib/checkout/model/checkout'
import type {
  CheckoutAddressInput,
  CheckoutBillingAddressInput,
} from '@/lib/checkout/validation/address'
import { checkoutAddressSchema } from '@/lib/checkout/validation/address'

function normalizeCheckoutAddressFormValue(value: string | null | undefined) {
  return value?.trim() ?? ''
}

function getCustomerAddressStateFormValues(address: CustomerAddress) {
  const stateAbbr = normalizeCheckoutAddressFormValue(address.stateAbbr)
  const stateName = normalizeCheckoutAddressFormValue(address.stateName)
  const stateText = normalizeCheckoutAddressFormValue(address.stateText)

  if (stateAbbr) {
    return {
      stateAbbr,
      stateName,
    }
  }

  if (stateText && stateText.length <= 3) {
    return {
      stateAbbr: stateText.toUpperCase(),
      stateName,
    }
  }

  return {
    stateAbbr: '',
    stateName: stateName || stateText,
  }
}

export function getCheckoutAddressSignature(address: CheckoutAddressInput) {
  return JSON.stringify(address)
}

export function getCheckoutBillingAddressFormDefaults({
  address,
  fallbackCountryIso,
}: {
  address: CheckoutAddress | null
  fallbackCountryIso: string
}): CheckoutBillingAddressInput {
  return {
    address1: normalizeCheckoutAddressFormValue(address?.address1),
    address2: normalizeCheckoutAddressFormValue(address?.address2),
    city: normalizeCheckoutAddressFormValue(address?.city),
    company: normalizeCheckoutAddressFormValue(address?.company),
    countryIso:
      normalizeCheckoutAddressFormValue(address?.countryIso) ||
      fallbackCountryIso,
    firstName: normalizeCheckoutAddressFormValue(address?.firstName),
    lastName: normalizeCheckoutAddressFormValue(address?.lastName),
    phone: normalizeCheckoutAddressFormValue(address?.phone),
    postalCode: normalizeCheckoutAddressFormValue(address?.postalCode),
    stateAbbr: normalizeCheckoutAddressFormValue(address?.stateAbbr),
    stateName: normalizeCheckoutAddressFormValue(address?.stateName),
  }
}

export function getCheckoutAddressFormDefaults({
  address,
  email,
  fallbackCountryIso,
}: {
  address: CheckoutAddress | null
  email: string | null
  fallbackCountryIso: string
}): CheckoutAddressInput {
  return {
    ...getCheckoutBillingAddressFormDefaults({
      address,
      fallbackCountryIso,
    }),
    email: normalizeCheckoutAddressFormValue(email),
  }
}

export function getCheckoutAddressFormDefaultsFromCustomerAddress({
  address,
  email,
}: {
  address: CustomerAddress
  email: string | null
}): CheckoutAddressInput {
  const stateValues = getCustomerAddressStateFormValues(address)

  return {
    address1: normalizeCheckoutAddressFormValue(address.address1),
    address2: normalizeCheckoutAddressFormValue(address.address2),
    city: normalizeCheckoutAddressFormValue(address.city),
    company: normalizeCheckoutAddressFormValue(address.company),
    countryIso: normalizeCheckoutAddressFormValue(address.countryIso),
    email: normalizeCheckoutAddressFormValue(email),
    firstName: normalizeCheckoutAddressFormValue(address.firstName),
    lastName: normalizeCheckoutAddressFormValue(address.lastName),
    phone: normalizeCheckoutAddressFormValue(address.phone),
    postalCode: normalizeCheckoutAddressFormValue(address.postalCode),
    stateAbbr: stateValues.stateAbbr,
    stateName: stateValues.stateName,
  }
}

export function getInitialSavedAddressSignature(address: CheckoutAddressInput) {
  const result = checkoutAddressSchema.safeParse(address)

  return result.success ? getCheckoutAddressSignature(result.data) : null
}
