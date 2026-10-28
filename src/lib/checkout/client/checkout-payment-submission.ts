import type { MarketSelectionInput } from '@/lib/core/market'

export function getCheckoutPaymentSubmissionMutationKey({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return [
    'checkout-payment-submission',
    market.country,
    market.locale,
    cartId,
  ] as const
}

export function getCheckoutPaymentSubmissionMutationScopeId({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return getCheckoutPaymentSubmissionMutationKey({ cartId, market }).join(':')
}
