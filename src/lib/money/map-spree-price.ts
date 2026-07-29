import type { Price as SpreePrice } from '@spree/sdk'

import type { Money } from './money'

export function mapSpreePriceToMoney(price: SpreePrice): Money | null {
  if (price.amount_in_cents == null || !price.currency) {
    return null
  }

  return {
    amount: price.amount_in_cents / 100,
    currencyCode: price.currency,
  }
}
