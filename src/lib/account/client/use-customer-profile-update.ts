import { useMutation } from '@tanstack/react-query'

import type { CustomerProfile } from '@/lib/account/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

import { updateCustomerProfile } from '../api/customer-session.functions'
import type { CustomerProfileUpdateInput } from '../validation/profile'
import {
  getCustomerProfileMutationKey,
  getCustomerProfileMutationScopeId,
} from './customer-profile-mutation'

type CustomerProfileUpdateVariables =
  | CustomerProfileUpdateInput
  | {
      data: CustomerProfileUpdateInput
      ownerId?: string
    }

function getUpdateVariables(variables: CustomerProfileUpdateVariables) {
  return 'data' in variables
    ? variables
    : { data: variables, ownerId: undefined }
}

export function useCustomerProfileUpdate({
  market,
  onError,
  onUpdated,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onError?: (error: unknown, ownerId?: string) => void
  onUpdated?: (
    customer: CustomerProfile,
    ownerId?: string,
  ) => void | Promise<void>
}) {
  const mutationKey = getCustomerProfileMutationKey(market)

  return useMutation({
    mutationKey,
    scope: { id: getCustomerProfileMutationScopeId(market) },
    mutationFn: (variables: CustomerProfileUpdateVariables) => {
      const { data } = getUpdateVariables(variables)

      return updateCustomerProfile({ data: { ...data, market } })
    },
    onError: (error, variables) => {
      try {
        return Promise.resolve(
          onError?.(error, getUpdateVariables(variables).ownerId),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
    onSuccess: (customer, variables) => {
      try {
        return Promise.resolve(
          onUpdated?.(customer, getUpdateVariables(variables).ownerId),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
  })
}
