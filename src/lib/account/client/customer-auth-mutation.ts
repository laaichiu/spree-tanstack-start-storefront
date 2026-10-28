import type { QueryClient } from '@tanstack/react-query'

import type { MarketSelectionInput } from '@/lib/core/market'

type CustomerAuthMutationOperation =
  'login' | 'logout' | 'register' | 'reset-password'

export function getCustomerAuthMutationKey({
  market,
  operation,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  operation: CustomerAuthMutationOperation
}) {
  return [
    'customer-auth-session',
    operation,
    market.country,
    market.locale,
  ] as const
}

export function getCustomerAuthMutationScopeId() {
  // Auth cookies are global to the storefront session, even when the API
  // client is market-specific. Every auth transition must therefore share one
  // serialization scope across markets and operation types.
  return 'customer-auth-session'
}

export function hasPendingCustomerAuthMutation(queryClient: QueryClient) {
  return queryClient
    .getMutationCache()
    .findAll({ mutationKey: ['customer-auth-session'] })
    .some((mutation) => mutation.state.status === 'pending')
}
