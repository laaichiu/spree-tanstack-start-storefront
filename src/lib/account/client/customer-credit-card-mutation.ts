import type { MarketSelectionInput } from '@/lib/core/market'

export function getCustomerCreditCardDeletionMutationKey(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return ['customer-credit-card-delete', market.country, market.locale] as const
}

export function getCustomerCreditCardDeletionMutationScopeId(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return getCustomerCreditCardDeletionMutationKey(market).join(':')
}
