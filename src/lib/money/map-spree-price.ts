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

/**
 * Maps the effective strikethrough price used by the Store API.
 *
 * `original_price` is populated for a resolved Price List price, while
 * `compare_at_amount` is the variant's configured Compare-at amount. The
 * official storefront supports both representations.
 */
export function mapSpreeCompareAtPriceToMoney(
  price: SpreePrice | null | undefined,
  originalPrice: SpreePrice | null | undefined,
): Money | undefined {
  if (!price) {
    return undefined
  }

  if (
    originalPrice?.amount_in_cents != null &&
    price.amount_in_cents != null &&
    originalPrice.amount_in_cents > price.amount_in_cents
  ) {
    const mappedOriginalPrice = mapSpreePriceToMoney(originalPrice)

    if (mappedOriginalPrice) {
      return mappedOriginalPrice
    }
  }

  if (
    price.compare_at_amount_in_cents == null ||
    !price.currency ||
    price.amount_in_cents == null ||
    price.compare_at_amount_in_cents <= price.amount_in_cents
  ) {
    return undefined
  }

  return {
    amount: price.compare_at_amount_in_cents / 100,
    currencyCode: price.currency,
  }
}
