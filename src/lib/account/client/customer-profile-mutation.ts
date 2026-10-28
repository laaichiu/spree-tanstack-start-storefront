import type { QueryClient } from '@tanstack/react-query'

import type { MarketSelectionInput } from '@/lib/core/market'

export function getCustomerProfileMutationKey(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return ['customer-profile-update', market.country, market.locale] as const
}

export function getCustomerProfileMutationScopeId(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return getCustomerProfileMutationKey(market).join(':')
}

export function hasPendingCustomerProfileMutation({
  market,
  ownerId,
  queryClient,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  ownerId: string
  queryClient: QueryClient
}) {
  return queryClient
    .getMutationCache()
    .findAll({
      exact: true,
      mutationKey: getCustomerProfileMutationKey(market),
    })
    .some((mutation) => {
      const variables = mutation.state.variables

      return (
        mutation.state.status === 'pending' &&
        typeof variables === 'object' &&
        variables !== null &&
        'ownerId' in variables &&
        variables.ownerId === ownerId
      )
    })
}
