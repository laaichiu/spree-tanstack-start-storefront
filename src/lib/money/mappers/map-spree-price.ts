import type { Price as SpreePrice } from '@spree/sdk'

import type { Money } from '@/lib/core/money'
import { mapSpreeAmountToMoney } from '../map-spree-amount'

export function mapSpreePriceToMoney(price: SpreePrice): Money | null {
  if (price.amount === null || !price.currency) {
    return null
  }

  return mapSpreeAmountToMoney(price.amount, price.currency)
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
    originalPrice?.amount != null &&
    price.amount != null &&
    originalPrice.currency === price.currency &&
    Number(originalPrice.amount) > Number(price.amount)
  ) {
    const mappedOriginalPrice = mapSpreePriceToMoney(originalPrice)

    if (mappedOriginalPrice) {
      return mappedOriginalPrice
    }
  }

  if (
    price.compare_at_amount == null ||
    !price.currency ||
    price.amount == null ||
    Number(price.compare_at_amount) <= Number(price.amount)
  ) {
    return undefined
  }

  return mapSpreeAmountToMoney(price.compare_at_amount, price.currency)
}
