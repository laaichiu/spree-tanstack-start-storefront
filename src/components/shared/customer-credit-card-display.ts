import type { CustomerCreditCard } from '@/lib/account/contracts'

export function formatCustomerCreditCardBrand(brand: string, fallback = '') {
  return brand.trim().toUpperCase() || fallback
}

export function formatCustomerCreditCardExpiry(
  card: Pick<CustomerCreditCard, 'expiryMonth' | 'expiryYear'>,
) {
  return `${String(card.expiryMonth).padStart(2, '0')}/${card.expiryYear}`
}
