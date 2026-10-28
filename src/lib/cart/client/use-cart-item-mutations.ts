import { useIsMutating, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import {
  useRemoveCartItem,
  useResetCartSession,
  useUpdateCartItem,
} from './use-cart-mutations'
import { getCartMutationKey, getCartResetMutationKey } from './cart-mutation'
import { readCartMutationErrorMessage } from '../utils/cart-errors'

function getMutationCartId(variables: unknown) {
  if (
    variables &&
    typeof variables === 'object' &&
    'requestCartId' in variables &&
    (typeof variables.requestCartId === 'string' ||
      variables.requestCartId === null)
  ) {
    return variables.requestCartId
  }

  return null
}

function matchesCartMutationOwner(
  mutationKey: readonly unknown[] | undefined,
  variables: unknown,
  cartId: string | null | undefined,
  cartResetMutationKey: readonly unknown[],
) {
  const isGlobalCartReset =
    mutationKey?.length === cartResetMutationKey.length &&
    mutationKey.every((part, index) => part === cartResetMutationKey[index])

  return isGlobalCartReset || getMutationCartId(variables) === (cartId ?? null)
}

type UseCartItemMutationsOptions = {
  cartId?: string | null
  errorMessage: string
  market: MarketSelectionInput
}

export function useCartItemMutations({
  cartId,
  errorMessage,
  market,
}: UseCartItemMutationsOptions) {
  const queryClient = useQueryClient()
  const removeCartItem = useRemoveCartItem({ market })
  const resetCartSession = useResetCartSession({ market })
  const updateCartItem = useUpdateCartItem({ market })
  const [pendingLineItemId, setPendingLineItemId] = useState<string | null>(
    null,
  )
  const [cartMutationError, setCartMutationError] = useState<string | null>(
    null,
  )
  const itemMutationInFlightRef = useRef(false)
  const resetMutationInFlightRef = useRef(false)
  const mutationGenerationRef = useRef(0)
  const [resettingGeneration, setResettingGeneration] = useState<number | null>(
    null,
  )
  const cartMutationKey = getCartMutationKey(market)
  const cartResetMutationKey = getCartResetMutationKey(market)
  const hasPendingCartMutation = () =>
    queryClient
      .getMutationCache()
      .findAll({ mutationKey: cartMutationKey })
      .some(
        (mutation) =>
          mutation.state.status === 'pending' &&
          matchesCartMutationOwner(
            mutation.options.mutationKey,
            mutation.state.variables,
            cartId,
            cartResetMutationKey,
          ),
      )
  const isCartMutationPending =
    useIsMutating({
      mutationKey: cartMutationKey,
      predicate: (mutation) =>
        matchesCartMutationOwner(
          mutation.options.mutationKey,
          mutation.state.variables,
          cartId,
          cartResetMutationKey,
        ),
    }) > 0 || pendingLineItemId !== null

  useEffect(() => {
    mutationGenerationRef.current += 1
    itemMutationInFlightRef.current = false
    resetMutationInFlightRef.current = false
    setResettingGeneration(null)
    setPendingLineItemId(null)
    setCartMutationError(null)

    return () => {
      mutationGenerationRef.current += 1
      itemMutationInFlightRef.current = false
      resetMutationInFlightRef.current = false
    }
  }, [cartId, market.country, market.locale])

  async function runItemMutation(
    lineItemId: string,
    operation: () => Promise<unknown>,
    rethrowOnFailure = false,
  ) {
    if (
      itemMutationInFlightRef.current ||
      isCartMutationPending ||
      hasPendingCartMutation()
    ) {
      return
    }

    const mutationGeneration = mutationGenerationRef.current
    itemMutationInFlightRef.current = true
    setCartMutationError(null)
    setPendingLineItemId(lineItemId)

    try {
      await operation()
    } catch (error) {
      if (mutationGenerationRef.current === mutationGeneration) {
        setCartMutationError(readCartMutationErrorMessage(error, errorMessage))
      }

      if (rethrowOnFailure) {
        throw error
      }
    } finally {
      if (mutationGenerationRef.current === mutationGeneration) {
        itemMutationInFlightRef.current = false
        setPendingLineItemId(null)
      }
    }
  }

  async function updateQuantity(lineItemId: string, quantity: number) {
    await runItemMutation(
      lineItemId,
      () => updateCartItem.mutateAsync({ cartId, lineItemId, quantity }),
      true,
    )
  }

  async function removeItem(lineItemId: string) {
    await runItemMutation(lineItemId, () =>
      removeCartItem.mutateAsync({ cartId, lineItemId }),
    )
  }

  async function recoverCartSession() {
    if (
      resetMutationInFlightRef.current ||
      isCartMutationPending ||
      hasPendingCartMutation()
    ) {
      return
    }

    const mutationGeneration = mutationGenerationRef.current
    resetMutationInFlightRef.current = true
    setResettingGeneration(mutationGeneration)
    setCartMutationError(null)

    try {
      await resetCartSession.mutateAsync()
    } catch (error) {
      if (mutationGenerationRef.current === mutationGeneration) {
        setCartMutationError(readCartMutationErrorMessage(error, errorMessage))
      }
    } finally {
      if (mutationGenerationRef.current === mutationGeneration) {
        resetMutationInFlightRef.current = false
        setResettingGeneration(null)
      }
    }
  }

  return {
    cartMutationError,
    isCartMutationPending,
    isResetPending: resettingGeneration === mutationGenerationRef.current,
    recoverCartSession,
    removeItem,
    updateQuantity,
  }
}
