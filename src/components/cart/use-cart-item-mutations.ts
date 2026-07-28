import { useState } from 'react'

import {
  useRemoveCartItem,
  useResetCartSession,
  useUpdateCartItem,
} from './use-cart'

type UseCartItemMutationsOptions = {
  errorMessage: string
}

export function useCartItemMutations({
  errorMessage,
}: UseCartItemMutationsOptions) {
  const removeCartItem = useRemoveCartItem()
  const resetCartSession = useResetCartSession()
  const updateCartItem = useUpdateCartItem()
  const [pendingLineItemId, setPendingLineItemId] = useState<string | null>(
    null,
  )
  const [cartMutationError, setCartMutationError] = useState<string | null>(
    null,
  )

  async function updateQuantity(lineItemId: string, quantity: number) {
    setCartMutationError(null)
    setPendingLineItemId(lineItemId)

    try {
      await updateCartItem.mutateAsync({ lineItemId, quantity })
    } catch {
      setCartMutationError(errorMessage)
    } finally {
      setPendingLineItemId(null)
    }
  }

  async function removeItem(lineItemId: string) {
    setCartMutationError(null)
    setPendingLineItemId(lineItemId)

    try {
      await removeCartItem.mutateAsync({ lineItemId })
    } catch {
      setCartMutationError(errorMessage)
    } finally {
      setPendingLineItemId(null)
    }
  }

  async function recoverCartSession() {
    setCartMutationError(null)

    try {
      await resetCartSession.mutateAsync()
    } catch {
      setCartMutationError(errorMessage)
    }
  }

  return {
    cartMutationError,
    isResetPending: resetCartSession.isPending,
    pendingLineItemId,
    recoverCartSession,
    removeItem,
    updateQuantity,
  }
}
