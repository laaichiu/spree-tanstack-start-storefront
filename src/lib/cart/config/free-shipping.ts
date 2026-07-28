import type { CartFreeShippingPromotion } from '@/lib/cart/model/cart'

const THRESHOLD_ENV_KEY =
  'VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT' as const

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
  input: Record<string, string | undefined>,
  currencyCode: string,
): CartFreeShippingPromotion | null {
  const rawThreshold = input[THRESHOLD_ENV_KEY]?.trim()

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

export function getConfiguredCartFreeShippingPromotion(currencyCode: string) {
  return readCartFreeShippingPromotion(
    {
      [THRESHOLD_ENV_KEY]: import.meta.env
        .VITE_STOREFRONT_FREE_SHIPPING_THRESHOLD_AMOUNT,
    },
    currencyCode,
  )
}
