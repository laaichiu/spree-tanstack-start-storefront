import type { ResolvedMarket } from '@/lib/core/market'

export const CUSTOMER_GIFT_CARD_CURRENCY_MISMATCH_MESSAGE =
  'This gift card does not match the current market currency.'

export class CustomerGiftCardCurrencyMismatchError extends Error {
  constructor() {
    super(CUSTOMER_GIFT_CARD_CURRENCY_MISMATCH_MESSAGE)
    this.name = 'CustomerGiftCardCurrencyMismatchError'
  }
}

function normalizeCurrency(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : undefined
}

export function assertCustomerGiftCardMatchesMarket(
  giftCard: { currency?: unknown },
  market: Pick<ResolvedMarket, 'currencyCode'>,
) {
  if (
    normalizeCurrency(giftCard.currency) !==
    normalizeCurrency(market.currencyCode)
  ) {
    throw new CustomerGiftCardCurrencyMismatchError()
  }
}
