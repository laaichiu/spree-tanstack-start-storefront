import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import {
  getCustomerAuthMutationKey,
  getCustomerAuthMutationScopeId,
  hasPendingCustomerAuthMutation,
} from './customer-auth-mutation'
import { removeCustomerCommerceQueries } from './customer-commerce-query-cleanup'

type CustomerAuthMutationOptions<TData, TVariables> = {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  mutationFn: (variables: TVariables) => Promise<TData>
  onAuthenticated?: () => void | Promise<void>
  operation: 'login' | 'register'
}

export function useCustomerAuthMutation<TData, TVariables>({
  market,
  mutationFn,
  onAuthenticated,
  operation,
}: CustomerAuthMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()
  const authContextKey = `${market.country}:${market.locale}`
  const authContextGenerationRef = useRef(0)
  const previousAuthContextKeyRef = useRef(authContextKey)

  if (previousAuthContextKeyRef.current !== authContextKey) {
    previousAuthContextKeyRef.current = authContextKey
    authContextGenerationRef.current += 1
  }

  const authContextOwner = `${authContextGenerationRef.current}:${authContextKey}`
  const currentAuthContextOwnerRef = useRef(authContextOwner)
  currentAuthContextOwnerRef.current = authContextOwner
  const onAuthenticatedRef = useRef(onAuthenticated)
  onAuthenticatedRef.current = onAuthenticated
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  const mutationKey = getCustomerAuthMutationKey({ market, operation })
  const isMutationPending = useIsMutating({ mutationKey }) > 0
  const isAuthMutationPending =
    useIsMutating({ mutationKey: ['customer-auth-session'] }) > 0
  const mutationInFlightRef = useRef<string | null>(null)
  const [mutationOwner, setMutationOwner] = useState<string | null>(null)

  const mutation = useMutation<TData, Error, TVariables>({
    mutationKey,
    scope: { id: getCustomerAuthMutationScopeId() },
    mutationFn,
    onMutate: () => {
      setMutationOwner(currentAuthContextOwnerRef.current)
    },
    onSuccess: () => {
      removeCustomerCommerceQueries(queryClient)

      if (!isMountedRef.current) {
        return
      }

      try {
        return Promise.resolve(onAuthenticatedRef.current?.()).catch(
          () => undefined,
        )
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
  }, [authContextOwner])

  const submit = useCallback(
    (variables: TVariables) => {
      if (
        mutationInFlightRef.current === authContextOwner ||
        isMutationPending ||
        isAuthMutationPending ||
        hasPendingCustomerAuthMutation(queryClient)
      ) {
        return
      }

      mutationInFlightRef.current = authContextOwner
      setMutationOwner(authContextOwner)
      mutation.mutate(variables, {
        onSettled: () => {
          if (mutationInFlightRef.current === authContextOwner) {
            mutationInFlightRef.current = null
          }
        },
      })
    },
    [
      authContextOwner,
      isAuthMutationPending,
      isMutationPending,
      mutation,
      queryClient,
    ],
  )

  return {
    ...mutation,
    isError:
      mutation.isError && mutationOwner === currentAuthContextOwnerRef.current,
    isPending: mutation.isPending || isMutationPending || isAuthMutationPending,
    submit,
  }
}
