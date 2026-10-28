import type { Money } from '@/lib/core/money'
import type { CartFreeShippingPromotion, CartSummary } from './cart'

export type CartFreeShippingProgress = {
  isThresholdReached: boolean
  progressPercent: number
  remaining: Money
}

function readThresholdByCurrency(rawThreshold: string, currencyCode: string) {
  const normalizedCurrencyCode = currencyCode.trim().toUpperCase()

  if (!/^[A-Z]{3}$/.test(normalizedCurrencyCode)) {
    return null
  }

  const entries = rawThreshold.includes(',')
    ? rawThreshold.split(',')
    : rawThreshold.includes('=') || rawThreshold.includes(':')
      ? [rawThreshold]
      : [['USD', rawThreshold].join('=')]

  const thresholds = new Map<string, number>()

  for (const entry of entries) {
    const [rawCode, rawAmount] = entry.split(/[=:]/, 2)
    const code = rawCode.trim().toUpperCase()
    const amount = Number(rawAmount.trim())

    if (
      !code ||
      !/^[A-Z]{3}$/.test(code) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      thresholds.has(code)
    ) {
      return null
    }

    thresholds.set(code, amount)
  }

  return thresholds.get(normalizedCurrencyCode) ?? null
}

export function readCartFreeShippingPromotion(
  rawThresholdInput: string | null | undefined,
  currencyCode: string,
): CartFreeShippingPromotion | null {
  const rawThreshold = rawThresholdInput?.trim()

  if (!rawThreshold) {
    return null
  }

  const thresholdAmount = readThresholdByCurrency(rawThreshold, currencyCode)

  if (thresholdAmount === null) {
    return null
  }

  return {
    comparison: 'greaterThan',
    threshold: {
      amount: thresholdAmount,
      currencyCode: currencyCode.trim().toUpperCase(),
    },
  }
}

function getCurrencyFractionDigits(currencyCode: string) {
  try {
    return (
      new Intl.NumberFormat('en', {
        currency: currencyCode,
        style: 'currency',
      }).resolvedOptions().maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}

export function getCartFreeShippingProgress(
  cart: Pick<CartSummary, 'itemTotal'>,
  promotion: CartFreeShippingPromotion,
): CartFreeShippingProgress | null {
  if (
    !cart.itemTotal ||
    cart.itemTotal.currencyCode.toUpperCase() !==
      promotion.threshold.currencyCode.toUpperCase()
  ) {
    return null
  }

  const fractionDigits = getCurrencyFractionDigits(
    promotion.threshold.currencyCode,
  )
  const minorUnitScale = 10 ** fractionDigits
  const thresholdMinorUnits = Math.max(
    1,
    Math.round(promotion.threshold.amount * minorUnitScale),
  )
  const itemTotalMinorUnits = Math.max(
    0,
    Math.round(cart.itemTotal.amount * minorUnitScale),
  )
  const isThresholdReached = itemTotalMinorUnits > thresholdMinorUnits
  const requiredMinorUnits = thresholdMinorUnits + 1
  const remainingMinorUnits = Math.max(
    0,
    requiredMinorUnits - itemTotalMinorUnits,
  )
  const rawProgressPercent = Math.round(
    (itemTotalMinorUnits / thresholdMinorUnits) * 100,
  )

  return {
    isThresholdReached,
    progressPercent: isThresholdReached
      ? 100
      : Math.min(99, Math.max(0, rawProgressPercent)),
    remaining: {
      amount: remainingMinorUnits / minorUnitScale,
      currencyCode: promotion.threshold.currencyCode,
    },
  }
}
