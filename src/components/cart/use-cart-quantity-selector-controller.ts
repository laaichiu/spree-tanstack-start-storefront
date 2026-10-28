import type { FocusEvent, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

function parseDraftQuantity(value: string): number | undefined {
  if (!/^\d+$/.test(value)) {
    return undefined
  }

  const parsedValue = Number.parseInt(value, 10)

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : undefined
}

export function useCartQuantitySelectorController({
  maxQuantity,
  onUpdateQuantity,
  quantity,
}: {
  maxQuantity: number
  onUpdateQuantity: (quantity: number) => Promise<void>
  quantity: number
}) {
  const [draftQuantity, setDraftQuantity] = useState(String(quantity))
  const quantityRef = useRef(quantity)
  const isInputFocusedRef = useRef(false)
  const skipBlurCommitAfterStepRef = useRef(false)

  quantityRef.current = quantity

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
      setDraftQuantity(String(quantityRef.current))
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

  function handleInputFocus() {
    isInputFocusedRef.current = true
  }

  function handleInputBlur(event: FocusEvent<HTMLInputElement>) {
    isInputFocusedRef.current = false

    if (skipBlurCommitAfterStepRef.current) {
      skipBlurCommitAfterStepRef.current = false
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

  function getQuantityForStep() {
    return parseDraftQuantity(draftQuantity) ?? quantity
  }

  function handleStepPointerDown() {
    // The step button commits this draft after the focused input blurs.
    skipBlurCommitAfterStepRef.current = isInputFocusedRef.current
  }

  function handleStepDown() {
    const nextQuantity = Math.max(1, getQuantityForStep() - 1)
    setDraftQuantity(String(nextQuantity))
    void commitQuantity(nextQuantity)
  }

  function handleStepUp() {
    const nextQuantity = Math.min(maxQuantity, getQuantityForStep() + 1)
    setDraftQuantity(String(nextQuantity))
    void commitQuantity(nextQuantity)
  }

  return {
    draftQuantity,
    getQuantityForStep,
    handleInputBlur,
    handleInputChange,
    handleInputFocus,
    handleInputKeyDown,
    handleStepDown,
    handleStepPointerDown,
    handleStepUp,
  }
}
