import type { MarketSelectionInput } from '@/lib/core/market'

export function getCustomerPasswordResetMutationKey(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return [
    'customer-password-reset-request',
    market.country,
    market.locale,
  ] as const
}

export function getCustomerPasswordResetMutationScopeId(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return getCustomerPasswordResetMutationKey(market).join(':')
}
