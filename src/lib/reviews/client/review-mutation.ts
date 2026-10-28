import type { MarketSelectionInput } from '@/lib/core/market'

export function getProductReviewVoteMutationKey({
  market,
  productId,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  productId: string
}) {
  return [
    'product-review-vote',
    market.country,
    market.locale,
    productId,
  ] as const
}

export function getProductReviewVoteMutationScopeId({
  market,
  productId,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  productId: string
}) {
  return getProductReviewVoteMutationKey({ market, productId }).join(':')
}
