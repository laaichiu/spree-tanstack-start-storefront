import type { MarketSelectionInput } from '@/lib/core/market'

export function getCartMutationKey({
  country,
  locale,
}: Pick<MarketSelectionInput, 'country' | 'locale'>) {
  return ['cart-mutation', country, locale] as const
}

export function getCartMutationScopeId(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return getCartMutationKey(market).join(':')
}

export function getCartResetMutationKey(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return [...getCartMutationKey(market), 'reset'] as const
}
