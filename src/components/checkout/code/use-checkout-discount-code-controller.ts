import { useIsMutating, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import type { CartSummary } from '@/lib/cart/contracts'
import { hasCheckoutAllCodesApplied } from '@/lib/checkout/contracts'
import { useMarket } from '@/components/layout/market-provider'
import { getCheckoutMutationKey } from '@/lib/checkout/client/checkout-mutation'
import { getCheckoutAppliedCodePresentations } from './checkout-applied-code-display'
import type { CheckoutAppliedCodePresentation } from './checkout-applied-code-display'
import {
  useApplyCheckoutCode,
  useRemoveCheckoutDiscountCode,
  useRemoveCheckoutGiftCard,
} from '@/lib/checkout/client/use-checkout-code'
import { readCheckoutMutationErrorMessage } from '@/lib/checkout/utils/checkout-error'

function getAppliedCodeRemovalKey(
  appliedCode: CheckoutAppliedCodePresentation,
) {
  if (appliedCode.kind === 'discount') {
    return `discount:${appliedCode.code}`
  }

  return `gift_card:${appliedCode.id}`
}

export function useCheckoutDiscountCodeController({
  cart,
}: {
  cart: CartSummary
}) {
  const { market, t } = useMarket()
  const queryClient = useQueryClient()
  const codeContextKey = `${cart.id}:${market.country}:${market.locale}`
  const codeContextGenerationRef = useRef(0)
  const previousCodeContextKeyRef = useRef(codeContextKey)

  if (previousCodeContextKeyRef.current !== codeContextKey) {
    previousCodeContextKeyRef.current = codeContextKey
    codeContextGenerationRef.current += 1
  }

  const codeContextOwner = `${codeContextGenerationRef.current}:${codeContextKey}`
  const currentCodeContextOwnerRef = useRef(codeContextOwner)
  currentCodeContextOwnerRef.current = codeContextOwner
  const isMountedRef = useRef(true)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [removingCodeKey, setRemovingCodeKey] = useState<string | null>(null)
  const codeMutationInFlightRef = useRef(false)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    codeMutationInFlightRef.current = false
    setCode('')
    setError(null)
    setStatusMessage(null)
    setRemovingCodeKey(null)
  }, [codeContextKey])

  function isCurrentCodeContext(owner: string) {
    return isMountedRef.current && currentCodeContextOwnerRef.current === owner
  }

  const applyCode = useApplyCheckoutCode({
    cartId: cart.id,
    market,
  })
  const removeDiscountCode = useRemoveCheckoutDiscountCode({
    cartId: cart.id,
    market,
  })
  const removeGiftCard = useRemoveCheckoutGiftCard({
    cartId: cart.id,
    market,
  })
  const checkoutMutationKey = getCheckoutMutationKey({
    cartId: cart.id,
    market,
  })
  const isCheckoutMutationPending =
    useIsMutating({ mutationKey: checkoutMutationKey }) > 0
  function hasPendingCheckoutCodeMutation() {
    return queryClient
      .getMutationCache()
      .findAll({ exact: true, mutationKey: checkoutMutationKey })
      .some((mutation) => mutation.state.status === 'pending')
  }

  const normalizedCode = code.trim()
  const isCodeMutationPending =
    isCheckoutMutationPending ||
    applyCode.isPending ||
    removeDiscountCode.isPending ||
    removeGiftCard.isPending
  const appliedCodePresentations = getCheckoutAppliedCodePresentations({
    cart,
    locale: market.locale,
  })

  function isCodeMutationBlocked() {
    return (
      codeMutationInFlightRef.current ||
      isCodeMutationPending ||
      hasPendingCheckoutCodeMutation()
    )
  }

  function resetCodeMessages() {
    setError(null)
    setStatusMessage(null)
  }

  function handleCodeChange(nextCode: string) {
    setCode(nextCode)
    resetCodeMessages()
  }

  async function handleApplyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const requestOwner = codeContextOwner

    if (!isCurrentCodeContext(requestOwner)) {
      return
    }

    if (!normalizedCode) {
      return
    }

    if (isCodeMutationBlocked()) {
      return
    }

    codeMutationInFlightRef.current = true
    resetCodeMessages()

    try {
      const result = await applyCode.mutateAsync(normalizedCode)

      if (!isCurrentCodeContext(requestOwner)) {
        return
      }

      if (result.success) {
        setCode('')
        setStatusMessage(
          result.type === 'discount'
            ? t('checkout.discountCodeApplied')
            : t('checkout.giftCardApplied'),
        )
        return
      }

      setError(
        readCheckoutMutationErrorMessage(
          result.error,
          t('checkout.discountCodeApplyFailed'),
        ),
      )
    } catch (applyError) {
      if (!isCurrentCodeContext(requestOwner)) {
        return
      }

      setError(
        readCheckoutMutationErrorMessage(
          applyError,
          t('checkout.discountCodeApplyFailed'),
        ),
      )
    } finally {
      if (isCurrentCodeContext(requestOwner)) {
        codeMutationInFlightRef.current = false
      }
    }
  }

  async function removeAppliedCode(
    kind: 'discount' | 'gift_card',
    codeOrGiftCardId: string,
    mutate: typeof removeDiscountCode.mutateAsync,
  ) {
    const requestOwner = codeContextOwner

    if (!isCurrentCodeContext(requestOwner)) {
      return
    }

    if (isCodeMutationBlocked()) {
      return
    }

    codeMutationInFlightRef.current = true
    resetCodeMessages()
    setRemovingCodeKey(`${kind}:${codeOrGiftCardId}`)
    const successMessage =
      kind === 'discount'
        ? t('checkout.discountCodeRemoved')
        : t('checkout.giftCardRemoved')
    const failureMessage =
      kind === 'discount'
        ? t('checkout.discountCodeRemoveFailed')
        : t('checkout.giftCardRemoveFailed')

    try {
      const result = await mutate(codeOrGiftCardId)

      if (!isCurrentCodeContext(requestOwner)) {
        return
      }

      if (result.success) {
        setStatusMessage(successMessage)
        return
      }

      setError(readCheckoutMutationErrorMessage(result.error, failureMessage))
    } catch (removeError) {
      if (!isCurrentCodeContext(requestOwner)) {
        return
      }

      setError(readCheckoutMutationErrorMessage(removeError, failureMessage))
    } finally {
      if (isCurrentCodeContext(requestOwner)) {
        setRemovingCodeKey(null)
        codeMutationInFlightRef.current = false
      }
    }
  }

  return {
    actions: {
      codeChange: handleCodeChange,
      remove: (codeId: string) => {
        const appliedCode = appliedCodePresentations.find(
          (display) => display.id === codeId,
        )

        if (!appliedCode) {
          return
        }

        if (appliedCode.kind === 'discount') {
          void removeAppliedCode(
            'discount',
            appliedCode.code,
            removeDiscountCode.mutateAsync,
          )
          return
        }

        void removeAppliedCode(
          'gift_card',
          appliedCode.id,
          removeGiftCard.mutateAsync,
        )
      },
      submit: (event: FormEvent<HTMLFormElement>) => {
        void handleApplyCode(event)
      },
    },
    model: {
      appliedCodes: appliedCodePresentations.map((appliedCode) => ({
        amount: appliedCode.amount,
        id: appliedCode.id,
        label: appliedCode.label,
        removeLabel:
          appliedCode.kind === 'discount'
            ? t('checkout.removeDiscountCode')
            : t('checkout.removeGiftCard'),
        removing: removingCodeKey === getAppliedCodeRemovalKey(appliedCode),
      })),
      applyLabel: t('checkout.apply'),
      applyingLabel: t('checkout.applyingCode'),
      code,
      codeError: error,
      codeLabel: t('checkout.discountCodeOrGiftCard'),
      isApplyDisabled: isCodeMutationPending || !normalizedCode,
      isPending: isCodeMutationPending,
      showCodeEntry: !hasCheckoutAllCodesApplied(cart),
      statusMessage,
    },
  }
}
