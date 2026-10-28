import { useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'

import {
  useAccountSession,
  useAccountSessionRequiredRedirect,
} from './account-session-provider'
import { readAccountMutationErrorMessage } from '../utils/account-error'
import { isCustomerSessionRequiredError } from '../utils/customer-session-error'
import { useCustomerCreditCardDeletion } from './use-customer-credit-card-deletion'

export function useCustomerCreditCardDeletionController({
  errorMessage,
  market,
  onDeleted,
}: {
  errorMessage: string
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  onDeleted?: () => void | Promise<void>
}) {
  const customer = useAccountSession()
  const cardContextKey = `${customer.id}:${market.country}:${market.locale}`
  const cardContextGenerationRef = useRef(0)
  const previousCardContextKeyRef = useRef(cardContextKey)

  if (previousCardContextKeyRef.current !== cardContextKey) {
    previousCardContextKeyRef.current = cardContextKey
    cardContextGenerationRef.current += 1
  }

  const cardContextOwner = `${cardContextGenerationRef.current}:${cardContextKey}`
  const currentCardContextOwnerRef = useRef(cardContextOwner)
  currentCardContextOwnerRef.current = cardContextOwner
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])
  const redirectToLogin = useAccountSessionRequiredRedirect()
  const redirectToLoginRef = useRef(redirectToLogin)
  redirectToLoginRef.current = redirectToLogin
  const [mutationError, setMutationError] = useState<string | null>(null)
  const pendingCardKeysRef = useRef(new Set<string>())

  function isCurrentCardOwner(ownerId: string | undefined) {
    return (
      isMountedRef.current && ownerId === currentCardContextOwnerRef.current
    )
  }

  const deleteMutation = useCustomerCreditCardDeletion({
    market,
    onError: async (error, ownerId) => {
      if (!isCurrentCardOwner(ownerId)) {
        return
      }

      if (isCustomerSessionRequiredError(error)) {
        setMutationError(null)
        await redirectToLoginRef.current()
        return
      }

      setMutationError(readAccountMutationErrorMessage(error, errorMessage))
    },
    onDeleted: async (ownerId) => {
      if (!isCurrentCardOwner(ownerId)) {
        return
      }

      setMutationError(null)
      await onDeleted?.()
    },
  })

  useEffect(() => {
    setMutationError(null)
  }, [cardContextOwner])

  function deleteCard(cardId: string) {
    const cardKey = `${cardContextOwner}:${cardId}`

    if (
      pendingCardKeysRef.current.has(cardKey) ||
      deleteMutation.isPendingForCard(cardId)
    ) {
      return
    }

    pendingCardKeysRef.current.add(cardKey)
    setMutationError(null)
    deleteMutation.mutate(
      { cardId, ownerId: cardContextOwner },
      {
        onSettled: () => {
          pendingCardKeysRef.current.delete(cardKey)
        },
      },
    )
  }

  return {
    deleteCard,
    error: mutationError,
    isPendingForCard: deleteMutation.isPendingForCard,
  }
}
