import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import { resetCustomerPassword } from '../api/account.functions'
import type { CustomerPasswordResetConfirmInput } from '../validation/password-reset'
import {
  getCustomerAuthMutationKey,
  getCustomerAuthMutationScopeId,
  hasPendingCustomerAuthMutation,
} from './customer-auth-mutation'
import { removeCustomerCommerceQueries } from './customer-commerce-query-cleanup'

export function useCustomerPasswordResetConfirmation({
  market,
  onReset,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onReset?: () => void | Promise<void>
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
  const onResetRef = useRef(onReset)
  onResetRef.current = onReset
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const mutationKey = getCustomerAuthMutationKey({
    market,
    operation: 'reset-password',
  })
  const isMutationPending = useIsMutating({ mutationKey }) > 0
  const isAuthMutationPending =
    useIsMutating({ mutationKey: ['customer-auth-session'] }) > 0
  const mutationInFlightRef = useRef<string | null>(null)
  const [mutationOwner, setMutationOwner] = useState<string | null>(null)

  const mutation = useMutation({
    mutationKey,
    scope: { id: getCustomerAuthMutationScopeId() },
    mutationFn: (data: CustomerPasswordResetConfirmInput) =>
      resetCustomerPassword({ data: { ...data, market } }),
    onMutate: () => {
      setMutationOwner(currentResetContextOwnerRef.current)
    },
    onSuccess: () => {
      removeCustomerCommerceQueries(queryClient)

      if (!isMountedRef.current) {
        return
      }

      try {
        return Promise.resolve(onResetRef.current?.()).catch(() => undefined)
      } catch {
        return undefined
      }
    },
  })

  const resetMutationRef = useRef(mutation.reset)
  resetMutationRef.current = mutation.reset

  useEffect(() => {
    setMutationOwner(null)
    resetMutationRef.current()
  }, [resetContextOwner])

  const submit = useCallback(
    (data: CustomerPasswordResetConfirmInput) => {
      if (
        mutationInFlightRef.current === resetContextOwner ||
        isMutationPending ||
        isAuthMutationPending ||
        hasPendingCustomerAuthMutation(queryClient)
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
    [
      isAuthMutationPending,
      isMutationPending,
      mutation,
      queryClient,
      resetContextOwner,
    ],
  )

  return {
    ...mutation,
    isError:
      mutation.isError && mutationOwner === currentResetContextOwnerRef.current,
    isPending:
      (mutation.isPending &&
        mutationOwner === currentResetContextOwnerRef.current) ||
      isMutationPending ||
      isAuthMutationPending,
    isSuccess:
      mutation.isSuccess &&
      mutationOwner === currentResetContextOwnerRef.current,
    submit,
  }
}
