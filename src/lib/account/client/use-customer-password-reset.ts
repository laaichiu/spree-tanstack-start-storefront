import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import { requestCustomerPasswordReset } from '../api/account.functions'
import type { CustomerPasswordResetInput } from '../validation/password-reset'
import {
  getCustomerPasswordResetMutationKey,
  getCustomerPasswordResetMutationScopeId,
} from './customer-password-reset-mutation'

function hasPendingPasswordResetRequest(
  queryClient: ReturnType<typeof useQueryClient>,
  mutationKey: ReturnType<typeof getCustomerPasswordResetMutationKey>,
) {
  return queryClient
    .getMutationCache()
    .findAll({ exact: true, mutationKey })
    .some((mutation) => mutation.state.status === 'pending')
}

export function useCustomerPasswordReset({
  market,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  const queryClient = useQueryClient()
  const resetContextKey = `${market.country}:${market.locale}`
  const resetContextGenerationRef = useRef(0)
  const previousResetContextKeyRef = useRef(resetContextKey)

  if (previousResetContextKeyRef.current !== resetContextKey) {
    previousResetContextKeyRef.current = resetContextKey
    resetContextGenerationRef.current += 1
  }

  const resetContextOwner = `${resetContextGenerationRef.current}:${resetContextKey}`
  const currentResetContextOwnerRef = useRef(resetContextOwner)
  currentResetContextOwnerRef.current = resetContextOwner
  const mutationKey = getCustomerPasswordResetMutationKey(market)
  const isMutationPending = useIsMutating({ mutationKey }) > 0
  const mutationInFlightRef = useRef<string | null>(null)
  const [mutationOwner, setMutationOwner] = useState<string | null>(null)
  const mutation = useMutation({
    mutationKey,
    scope: { id: getCustomerPasswordResetMutationScopeId(market) },
    mutationFn: (data: CustomerPasswordResetInput) =>
      requestCustomerPasswordReset({ data: { ...data, market } }),
    onMutate: () => {
      setMutationOwner(currentResetContextOwnerRef.current)
    },
  })
  const resetMutationRef = useRef(mutation.reset)
  resetMutationRef.current = mutation.reset

  useEffect(() => {
    setMutationOwner(null)
    resetMutationRef.current()
  }, [resetContextOwner])

  const submit = useCallback(
    (data: CustomerPasswordResetInput) => {
      if (
        mutationInFlightRef.current === resetContextOwner ||
        isMutationPending ||
        hasPendingPasswordResetRequest(queryClient, mutationKey)
      ) {
        return
      }

      mutationInFlightRef.current = resetContextOwner
      mutation.mutate(data, {
        onSettled: () => {
          if (mutationInFlightRef.current === resetContextOwner) {
            mutationInFlightRef.current = null
          }
        },
      })
    },
    [isMutationPending, mutation, mutationKey, queryClient, resetContextOwner],
  )

  return {
    ...mutation,
    isError:
      mutation.isError && mutationOwner === currentResetContextOwnerRef.current,
    isPending:
      (mutation.isPending &&
        mutationOwner === currentResetContextOwnerRef.current) ||
      isMutationPending,
    isSuccess:
      mutation.isSuccess &&
      mutationOwner === currentResetContextOwnerRef.current,
    submit,
  }
}
