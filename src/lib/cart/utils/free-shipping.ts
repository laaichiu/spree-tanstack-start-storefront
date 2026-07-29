import type {
  CartFreeShippingPromotion,
  CartSummary,
} from '@/lib/cart/model/cart'
import type { Money } from '@/lib/money/money'

export type CartFreeShippingProgress = {
  isThresholdReached: boolean
  progressPercent: number
  remaining: Money
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
