import type { QueryClient } from '@tanstack/react-query'

import type { MarketSelectionInput } from '@/lib/core/market'

export function getCustomerAddressMutationKey(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return ['customer-address-mutation', market.country, market.locale] as const
}

export function getCustomerAddressMutationScopeId(
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  return getCustomerAddressMutationKey(market).join(':')
}

export function hasPendingCustomerAddressMutation({
  addressId,
  mutationKey,
  operation,
  ownerId,
  queryClient,
}: {
  addressId: string | null
  mutationKey: ReturnType<typeof getCustomerAddressMutationKey>
  operation: 'delete' | 'save'
  ownerId: string
  queryClient: QueryClient
}) {
  return queryClient
    .getMutationCache()
    .findAll({ exact: true, mutationKey })
    .some((candidate) => {
      if (candidate.state.status !== 'pending') {
        return false
      }

      const variables = candidate.state.variables

      if (!variables || typeof variables !== 'object') {
        return false
      }

      if (!('ownerId' in variables) || variables.ownerId !== ownerId) {
        return false
      }

      if (operation === 'save') {
        if (!('values' in variables)) {
          return false
        }

        return (
          ('id' in variables && typeof variables.id === 'string'
            ? variables.id
            : null) === addressId
        )
      }

      return 'addressId' in variables && variables.addressId === addressId
    })
}
