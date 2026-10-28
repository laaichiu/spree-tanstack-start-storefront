import { useIsMutating, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import { useResetCartSession } from '../../cart/client/use-cart-mutations'
import { getCartResetMutationKey } from '../../cart/client/cart-mutation'
import {
  checkoutOrderQueryKey,
  checkoutOrderSnapshotQueryKey,
  getCheckoutOrderQueryKey,
} from './use-checkout-order'

function removeCheckoutQueriesForMarket(
  queryClient: ReturnType<typeof useQueryClient>,
  market: Pick<MarketSelectionInput, 'country' | 'locale'>,
) {
  queryClient.removeQueries({
    queryKey: getCheckoutOrderQueryKey({
      country: market.country,
      locale: market.locale,
    }),
  })
  queryClient.removeQueries({
    queryKey: [...checkoutOrderSnapshotQueryKey, market.country, market.locale],
  })
}

export function useResetCheckoutSession({
  market,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
}) {
  const queryClient = useQueryClient()
  const resetCartSession = useResetCartSession({ market })
  const isResetMutationPending =
    useIsMutating({ mutationKey: getCartResetMutationKey(market) }) > 0
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
  const currentResetContextKeyRef = useRef(resetContextKey)
  currentResetContextKeyRef.current = resetContextKey
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const resetInFlightRef = useRef<string | null>(null)
  const [resettingOwner, setResettingOwner] = useState<string | null>(null)

  const resetCheckoutSession = useCallback(async () => {
    const requestOwner = resetContextOwner
    const requestMarket = {
      country: market.country,
      locale: market.locale,
    }

    if (resetInFlightRef.current === requestOwner || isResetMutationPending) {
      return null
    }

    resetInFlightRef.current = requestOwner
    setResettingOwner(requestOwner)

    try {
      const result = await resetCartSession.mutateAsync()

      if (result === null) {
        return null
      }

      if (!isMountedRef.current) {
        return result
      }

      if (currentResetContextOwnerRef.current === requestOwner) {
        queryClient.removeQueries({ queryKey: checkoutOrderQueryKey })
        queryClient.removeQueries({ queryKey: checkoutOrderSnapshotQueryKey })
      } else if (currentResetContextKeyRef.current !== resetContextKey) {
        removeCheckoutQueriesForMarket(queryClient, requestMarket)
      }

      return result
    } finally {
      if (resetInFlightRef.current === requestOwner) {
        resetInFlightRef.current = null
      }

      if (
        isMountedRef.current &&
        currentResetContextOwnerRef.current === requestOwner
      ) {
        setResettingOwner(null)
      }
    }
  }, [
    isResetMutationPending,
    market.country,
    market.locale,
    queryClient,
    resetCartSession,
    resetContextKey,
    resetContextOwner,
  ])

  return {
    isPending: resettingOwner === resetContextOwner || isResetMutationPending,
    mutateAsync: resetCheckoutSession,
  }
}
