import { useState } from 'react'
import type { FormEvent } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type {
  CartAppliedDiscount,
  CartAppliedGiftCard,
  CartSummary,
} from '@/lib/cart/model/cart'

import { CheckoutAppliedCodeList } from './checkout-applied-code-list'
import { CheckoutDiscountCodeEntry } from './checkout-discount-code-entry'
import {
  useApplyCheckoutCode,
  useRemoveCheckoutDiscountCode,
  useRemoveCheckoutGiftCard,
} from './use-checkout-code'

export function CheckoutDiscountCodeForm({ cart }: { cart: CartSummary }) {
  const { t } = useMarket()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [removingCodeKey, setRemovingCodeKey] = useState<string | null>(null)
  const applyCode = useApplyCheckoutCode({
    cartId: cart.id,
  })
  const removeDiscountCode = useRemoveCheckoutDiscountCode({
    cartId: cart.id,
  })
  const removeGiftCard = useRemoveCheckoutGiftCard({
    cartId: cart.id,
  })
  const normalizedCode = code.trim()
  const isCodeMutationPending =
    applyCode.isPending ||
    removeDiscountCode.isPending ||
    removeGiftCard.isPending
  const isApplyDisabled = isCodeMutationPending || !normalizedCode
  const removableDiscounts = cart.appliedDiscounts.filter(
    (discount) => discount.code,
  )
  const hasAllCodesApplied =
    removableDiscounts.length > 0 && Boolean(cart.appliedGiftCard)

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

    if (!normalizedCode) {
      return
    }

    resetCodeMessages()

    try {
      const result = await applyCode.mutateAsync(normalizedCode)

      if (result.success) {
        setCode('')
        setStatusMessage(
          result.type === 'discount'
            ? t('checkout.discountCodeApplied')
            : t('checkout.giftCardApplied'),
        )
        return
      }

      setError(result.error || t('checkout.discountCodeApplyFailed'))
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : t('checkout.discountCodeApplyFailed'),
      )
    }
  }

  async function handleRemoveDiscount(discount: CartAppliedDiscount) {
    if (!discount.code) {
      return
    }

    resetCodeMessages()
    setRemovingCodeKey(`discount:${discount.code}`)

    try {
      const result = await removeDiscountCode.mutateAsync(discount.code)

      if (result.success) {
        setStatusMessage(t('checkout.discountCodeRemoved'))
        return
      }

      setError(result.error || t('checkout.discountCodeRemoveFailed'))
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : t('checkout.discountCodeRemoveFailed'),
      )
    } finally {
      setRemovingCodeKey(null)
    }
  }

  async function handleRemoveGiftCard(giftCard: CartAppliedGiftCard) {
    resetCodeMessages()
    setRemovingCodeKey(`gift_card:${giftCard.id}`)

    try {
      const result = await removeGiftCard.mutateAsync(giftCard.id)

      if (result.success) {
        setStatusMessage(t('checkout.giftCardRemoved'))
        return
      }

      setError(result.error || t('checkout.giftCardRemoveFailed'))
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : t('checkout.giftCardRemoveFailed'),
      )
    } finally {
      setRemovingCodeKey(null)
    }
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => void handleApplyCode(event)}
    >
      {!hasAllCodesApplied ? (
        <CheckoutDiscountCodeEntry
          code={code}
          disabled={isApplyDisabled}
          error={error}
          isPending={isCodeMutationPending}
          onChange={handleCodeChange}
        />
      ) : null}
      <CheckoutAppliedCodeList
        appliedGiftCard={cart.appliedGiftCard}
        onRemoveDiscount={(discount) => void handleRemoveDiscount(discount)}
        onRemoveGiftCard={(giftCard) => void handleRemoveGiftCard(giftCard)}
        removableDiscounts={removableDiscounts}
        removingCodeKey={removingCodeKey}
      />
      {statusMessage ? (
        <p aria-live="polite" className="sr-only" role="status">
          {statusMessage}
        </p>
      ) : null}
    </form>
  )
}
