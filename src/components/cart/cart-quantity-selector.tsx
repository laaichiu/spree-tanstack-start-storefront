import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { cn } from '@/lib/utils'

type CartQuantitySelectorProps = {
  disabled?: boolean
  maxQuantity?: number
  onUpdateQuantity: (quantity: number) => Promise<void>
  quantity: number
  size?: 'drawer' | 'page'
}

function parseDraftQuantity(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null
}

export function CartQuantitySelector({
  disabled = false,
  maxQuantity = 99,
  onUpdateQuantity,
  quantity,
  size = 'page',
}: CartQuantitySelectorProps) {
  const { t } = useMarket()
  const [draftQuantity, setDraftQuantity] = useState(String(quantity))
  const suppressBlurCommitRef = useRef(false)
  const isDrawer = size === 'drawer'

  useEffect(() => {
    setDraftQuantity(String(quantity))
  }, [quantity])

  async function commitQuantity(nextQuantity: number) {
    const clampedQuantity = Math.max(1, Math.min(nextQuantity, maxQuantity))

    if (clampedQuantity === quantity) {
      setDraftQuantity(String(quantity))
      return
    }

    try {
      await onUpdateQuantity(clampedQuantity)
    } catch {
      setDraftQuantity(String(quantity))
    }
  }

  async function commitDraftQuantity(draftValue: string) {
    const parsedQuantity = parseDraftQuantity(draftValue)

    if (!parsedQuantity) {
      setDraftQuantity(String(quantity))
      return
    }

    await commitQuantity(parsedQuantity)
  }

  function handleInputChange(nextValue: string) {
    if (!/^\d*$/.test(nextValue)) {
      return
    }

    setDraftQuantity(nextValue)
  }

  function handleInputBlur(event: FocusEvent<HTMLInputElement>) {
    if (suppressBlurCommitRef.current) {
      suppressBlurCommitRef.current = false
      return
    }

    void commitDraftQuantity(event.currentTarget.value)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      void commitDraftQuantity(event.currentTarget.value)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setDraftQuantity(String(quantity))
    }
  }

  function getBaseQuantity() {
    return parseDraftQuantity(draftQuantity) ?? quantity
  }

  function handleStepDown() {
    const nextQuantity = Math.max(1, getBaseQuantity() - 1)
    setDraftQuantity(String(nextQuantity))
    void commitQuantity(nextQuantity)
  }

  function handleStepUp() {
    const nextQuantity = Math.min(maxQuantity, getBaseQuantity() + 1)
    setDraftQuantity(String(nextQuantity))
    void commitQuantity(nextQuantity)
  }

  return (
    <div className="inline-flex items-center border border-input">
      <button
        aria-label={t('cart.decreaseQuantity')}
        className={cn(
          'flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50',
          isDrawer ? 'h-9 w-9 text-xl' : 'h-10 w-10 text-lg',
        )}
        disabled={disabled || getBaseQuantity() <= 1}
        onClick={handleStepDown}
        onPointerDown={() => {
          suppressBlurCommitRef.current = true
        }}
        type="button"
      >
        -
      </button>
      <input
        aria-label={t('cart.quantity')}
        className={cn(
          'border-x border-input bg-background px-0 text-center text-lg text-foreground outline-none transition-colors focus:bg-accent disabled:cursor-not-allowed disabled:text-muted-foreground',
          isDrawer ? 'h-9 w-12' : 'h-10 w-12',
        )}
        disabled={disabled}
        inputMode="numeric"
        onBlur={handleInputBlur}
        onChange={(event) => handleInputChange(event.target.value)}
        onKeyDown={handleInputKeyDown}
        pattern="[0-9]*"
        type="text"
        value={draftQuantity}
      />
      <button
        aria-label={t('cart.increaseQuantity')}
        className={cn(
          'flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50',
          isDrawer ? 'h-9 w-9 text-xl' : 'h-10 w-10 text-lg',
        )}
        disabled={disabled || getBaseQuantity() >= maxQuantity}
        onClick={handleStepUp}
        onPointerDown={() => {
          suppressBlurCommitRef.current = true
        }}
        type="button"
      >
        +
      </button>
    </div>
  )
}
