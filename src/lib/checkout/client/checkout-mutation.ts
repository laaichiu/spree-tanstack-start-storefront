import type { MarketSelectionInput } from '@/lib/core/market'

export function getCheckoutMutationKey({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return ['checkout-mutation', market.country, market.locale, cartId] as const
}

export function getCheckoutShippingAddressMutationKey({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return [
    ...getCheckoutMutationKey({ cartId, market }),
    'shipping-address',
  ] as const
}

export function getCheckoutBillingAddressMutationKey({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return [
    ...getCheckoutMutationKey({ cartId, market }),
    'billing-address',
  ] as const
}

export function getCheckoutShippingRateMutationKey({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return [
    ...getCheckoutMutationKey({ cartId, market }),
    'shipping-rate',
  ] as const
}

export function getCheckoutMutationScopeId({
  cartId,
  market,
}: {
  cartId: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  return getCheckoutMutationKey({ cartId, market }).join(':')
}
