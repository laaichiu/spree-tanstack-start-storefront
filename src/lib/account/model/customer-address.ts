export type CustomerAddress = {
  address1: string | null
  address2: string | null
  city: string | null
  company: string | null
  countryIso: string
  countryName: string
  firstName: string | null
  fullName: string
  id: string
  isDefaultBilling: boolean
  isDefaultShipping: boolean
  lastName: string | null
  phone: string | null
  postalCode: string | null
  quickCheckout: boolean
  stateAbbr: string | null
  stateName: string | null
  stateText: string | null
}

type DisplayAddress = Pick<
  CustomerAddress,
  | 'address1'
  | 'address2'
  | 'city'
  | 'company'
  | 'countryName'
  | 'phone'
  | 'postalCode'
  | 'stateText'
>

export function getAddressLines(address: DisplayAddress) {
  const region = [address.stateText, address.postalCode]
    .filter(Boolean)
    .join(' ')
  const locality = [address.city, region].filter(Boolean).join(', ')

  return [
    address.company,
    address.address1,
    address.address2,
    locality || null,
    address.countryName,
    address.phone,
  ].filter((line): line is string => Boolean(line))
}
