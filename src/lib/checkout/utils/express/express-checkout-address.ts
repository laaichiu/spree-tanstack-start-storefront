export type ExpressCheckoutStripeAddress = {
  city: string
  country: string
  line1: string
  line2: string | null
  postal_code: string
  state: string | null
}

export type ExpressCheckoutAddressParams = {
  address1: string
  address2?: string
  city: string
  country_code: string
  first_name: string
  last_name: string
  phone?: string
  postal_code: string
  quick_checkout: true
  state_code?: string
  state_name?: string
}

export function parseExpressCheckoutName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? '',
      lastName: '',
    }
  }

  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.at(-1) ?? '',
  }
}

function optionalAddressText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized || undefined
}

export function buildExpressCheckoutAddressParams({
  address,
  name,
  phone,
}: {
  address: ExpressCheckoutStripeAddress
  name: {
    firstName: string
    lastName: string
  }
  phone?: string | null
}): ExpressCheckoutAddressParams {
  return {
    address1: address.line1,
    address2: optionalAddressText(address.line2),
    city: address.city,
    country_code: address.country.toUpperCase(),
    first_name: name.firstName || 'Express',
    last_name: name.lastName || 'Checkout',
    phone: optionalAddressText(phone),
    postal_code: address.postal_code,
    quick_checkout: true,
    state_name: optionalAddressText(address.state),
  }
}
