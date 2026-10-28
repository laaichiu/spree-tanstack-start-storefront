import { useMutation } from '@tanstack/react-query'

import type { MarketSelectionInput } from '@/lib/core/market'

import type { CustomerAddressInput } from '../validation/address'
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from '../api/customer-address.functions'
import {
  getCustomerAddressMutationKey,
  getCustomerAddressMutationScopeId,
} from './customer-address-mutation'

type CustomerAddressMutationCallbacks = {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onDeleteError?: (error: unknown, ownerId?: string) => void
  onDeleted?: (ownerId?: string) => void | Promise<void>
  onSaveError?: (error: unknown, ownerId?: string) => void
  onSaved?: (ownerId?: string) => void | Promise<void>
}

type CustomerAddressSaveVariables = {
  id?: string
  ownerId?: string
  values: CustomerAddressInput
}

type CustomerAddressDeleteVariables =
  | string
  | {
      addressId: string
      ownerId?: string
    }

function getDeleteVariables(variables: CustomerAddressDeleteVariables) {
  return typeof variables === 'string'
    ? { addressId: variables, ownerId: undefined }
    : variables
}

export function useCustomerAddressMutations({
  market,
  onDeleteError,
  onDeleted,
  onSaveError,
  onSaved,
}: CustomerAddressMutationCallbacks) {
  const mutationKey = getCustomerAddressMutationKey(market)
  const addressMutation = useMutation({
    mutationKey,
    scope: { id: getCustomerAddressMutationScopeId(market) },
    mutationFn: ({ id, values }: CustomerAddressSaveVariables) =>
      id
        ? updateCustomerAddress({
            data: {
              address: values,
              id,
              market,
            },
          })
        : createCustomerAddress({
            data: { ...values, market },
          }),
    onError: (error, variables) => {
      try {
        return Promise.resolve(onSaveError?.(error, variables.ownerId)).catch(
          () => undefined,
        )
      } catch {
        return undefined
      }
    },
    onSuccess: (_data, variables) => {
      try {
        return Promise.resolve(onSaved?.(variables.ownerId)).catch(
          () => undefined,
        )
      } catch {
        return undefined
      }
    },
  })
  const deleteMutation = useMutation({
    mutationKey,
    scope: { id: getCustomerAddressMutationScopeId(market) },
    mutationFn: (variables: CustomerAddressDeleteVariables) => {
      const { addressId } = getDeleteVariables(variables)

      return deleteCustomerAddress({
        data: {
          id: addressId,
          market,
        },
      })
    },
    onError: (error, variables) => {
      try {
        return Promise.resolve(
          onDeleteError?.(error, getDeleteVariables(variables).ownerId),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
    onSuccess: (_data, variables) => {
      try {
        return Promise.resolve(
          onDeleted?.(getDeleteVariables(variables).ownerId),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
  })

  return { addressMutation, deleteMutation }
}
