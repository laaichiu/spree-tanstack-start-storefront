import type { MarketSelectionInput } from '@/lib/core/market'

export function getCheckoutPaymentMutationKey({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return [
    'checkout-payment-mutation',
    market.country,
    market.locale,
    cartId,
  ] as const
}

export function getCheckoutPaymentMutationScopeId({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return getCheckoutPaymentMutationKey({ cartId, market }).join(':')
}
