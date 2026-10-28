import { useIsMutating, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import {
  getCustomerAuthMutationKey,
  getCustomerAuthMutationScopeId,
  hasPendingCustomerAuthMutation,
} from './customer-auth-mutation'
import { useAccountSession } from './account-session-provider'
import { useCustomerLogout } from './use-customer-logout'

export function useCustomerSignOutController({
  errorMessage,
  market,
  onSignedOut,
}: {
  errorMessage: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onSignedOut?: () => void | Promise<void>
}) {
  const queryClient = useQueryClient()
  const customer = useAccountSession()
  const authContextKey = `${customer.id}:${market.country}:${market.locale}`
  const authContextGenerationRef = useRef(0)
  const previousAuthContextKeyRef = useRef(authContextKey)

  if (previousAuthContextKeyRef.current !== authContextKey) {
    previousAuthContextKeyRef.current = authContextKey
    authContextGenerationRef.current += 1
  }

  const authContextOwner = `${authContextGenerationRef.current}:${authContextKey}`
  const currentAuthContextOwnerRef = useRef(authContextOwner)
  currentAuthContextOwnerRef.current = authContextOwner
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const onSignedOutRef = useRef(onSignedOut)
  onSignedOutRef.current = onSignedOut
  const logoutMutation = useCustomerLogout({ market })
  const logoutMutationKey = getCustomerAuthMutationKey({
    market,
    operation: 'logout',
  })
  const isLogoutMutationPending =
    useIsMutating({
      mutationKey: logoutMutationKey,
    }) > 0
  const isAuthMutationPending =
    useIsMutating({
      mutationKey: [getCustomerAuthMutationScopeId()],
    }) > 0
  const signOutInFlightRef = useRef<string | null>(null)
  const [signingOutOwner, setSigningOutOwner] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    setSigningOutOwner(null)
    setSignOutError(null)
  }, [authContextOwner])

  const signOut = useCallback(async () => {
    if (
      signOutInFlightRef.current ||
      isAuthMutationPending ||
      isLogoutMutationPending ||
      hasPendingCustomerAuthMutation(queryClient)
    ) {
      return
    }

    const requestOwner = currentAuthContextOwnerRef.current
    signOutInFlightRef.current = requestOwner
    setSigningOutOwner(requestOwner)
    setSignOutError(null)
    try {
      try {
        await logoutMutation.mutateAsync()
      } catch {
        if (
          isMountedRef.current &&
          requestOwner === currentAuthContextOwnerRef.current
        ) {
          setSignOutError(errorMessage)
        }

        return
      }

      if (isMountedRef.current) {
        try {
          await onSignedOutRef.current?.()
        } catch {
          // Logout has already succeeded; navigation failure is not a logout failure.
        }
      }
    } finally {
      if (signOutInFlightRef.current === requestOwner) {
        signOutInFlightRef.current = null
      }
      if (
        isMountedRef.current &&
        requestOwner === currentAuthContextOwnerRef.current
      ) {
        setSigningOutOwner(null)
      }
    }
  }, [
    errorMessage,
    isAuthMutationPending,
    isLogoutMutationPending,
    logoutMutation,
    queryClient,
  ])

  return {
    error: signOutError,
    isSigningOut:
      signingOutOwner !== null ||
      logoutMutation.isPending ||
      isAuthMutationPending ||
      isLogoutMutationPending,
    signOut,
  }
}
