import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { MarketSelectionInput } from '@/lib/core/market'

import { logoutCustomer } from '../api/customer-session.functions'
import {
  getCustomerAuthMutationKey,
  getCustomerAuthMutationScopeId,
} from './customer-auth-mutation'
import { removeCustomerCommerceQueries } from './customer-commerce-query-cleanup'

export function useCustomerLogout({
  market,
  onError,
  onLoggedOut,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onError?: (error: unknown) => void
  onLoggedOut?: () => void | Promise<void>
}) {
  const queryClient = useQueryClient()
  const mutationKey = getCustomerAuthMutationKey({
    market,
    operation: 'logout',
  })

  return useMutation({
    mutationKey,
    scope: { id: getCustomerAuthMutationScopeId() },
    mutationFn: () => logoutCustomer({ data: market }),
    onError,
    onSuccess: () => {
      removeCustomerCommerceQueries(queryClient)

      try {
        return Promise.resolve(onLoggedOut?.()).catch(() => undefined)
      } catch {
        return undefined
      }
    },
  })
}
