import type { Price as SpreePrice } from '@spree/sdk'

import type { Money } from './money'

export function mapSpreePriceToMoney(price: SpreePrice): Money {
  if (price.amount_in_cents == null || !price.currency) {
    throw new Error('Spree price is missing amount or currency')
  }

  return {
    amount: price.amount_in_cents / 100,
    currencyCode: price.currency,
  }
}
