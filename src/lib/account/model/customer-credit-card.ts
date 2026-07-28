export type CustomerCreditCard = {
  brand: string
  default: boolean
  expiryMonth: number
  expiryYear: number
  gatewayPaymentProfileId: string | null
  id: string
  last4: string
  name: string | null
}

export function formatCustomerCreditCardBrand(brand: string, fallback = '') {
  return brand.trim().toUpperCase() || fallback
}

export function formatCustomerCreditCardExpiry(
  card: Pick<CustomerCreditCard, 'expiryMonth' | 'expiryYear'>,
) {
  return `${String(card.expiryMonth).padStart(2, '0')}/${card.expiryYear}`
}
