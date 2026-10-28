import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query'

import type { MarketSelectionInput } from '@/lib/core/market'

import { deleteCustomerCreditCard } from '../api/customer-credit-card.functions'
import {
  getCustomerCreditCardDeletionMutationKey,
  getCustomerCreditCardDeletionMutationScopeId,
} from './customer-credit-card-mutation'

type CustomerCreditCardDeletionState = {
  cardId: string | null
  status: 'error' | 'idle' | 'pending' | 'success'
}

type CustomerCreditCardDeletionVariables =
  | string
  | {
      cardId: string
      ownerId?: string
    }

function getDeletionVariables(variables: CustomerCreditCardDeletionVariables) {
  return typeof variables === 'string'
    ? { cardId: variables, ownerId: undefined }
    : variables
}

function readCardId(variables: unknown) {
  if (typeof variables === 'string') {
    return variables
  }

  if (
    variables &&
    typeof variables === 'object' &&
    'cardId' in variables &&
    typeof variables.cardId === 'string'
  ) {
    return variables.cardId
  }

  return null
}

export function useCustomerCreditCardDeletion({
  market,
  onError,
  onDeleted,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onError?: (error: unknown, ownerId?: string) => void
  onDeleted?: (ownerId?: string) => void | Promise<void>
}) {
  const queryClient = useQueryClient()
  const mutationKey = getCustomerCreditCardDeletionMutationKey(market)
  const mutationStates = useMutationState<CustomerCreditCardDeletionState>({
    filters: { mutationKey },
    select: (mutation) => ({
      cardId: readCardId(mutation.state.variables),
      status: mutation.state.status,
    }),
  })
  const mutation = useMutation({
    mutationKey,
    scope: { id: getCustomerCreditCardDeletionMutationScopeId(market) },
    mutationFn: (variables: CustomerCreditCardDeletionVariables) => {
      const { cardId } = getDeletionVariables(variables)

      return deleteCustomerCreditCard({
        data: {
          id: cardId,
          market,
        },
      })
    },
    onError: (error, variables) => {
      try {
        return Promise.resolve(
          onError?.(error, getDeletionVariables(variables).ownerId),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
    onSuccess: (_data, variables) => {
      try {
        return Promise.resolve(
          onDeleted?.(getDeletionVariables(variables).ownerId),
        ).catch(() => undefined)
      } catch {
        return undefined
      }
    },
  })

  return {
    ...mutation,
    isPendingForCard: (cardId: string) => {
      if (
        mutationStates.some(
          (state) => state.cardId === cardId && state.status === 'pending',
        )
      ) {
        return true
      }

      return queryClient
        .getMutationCache()
        .findAll({ exact: true, mutationKey })
        .some(
          (candidate) =>
            candidate.state.status === 'pending' &&
            readCardId(candidate.state.variables) === cardId,
        )
    },
  }
}
