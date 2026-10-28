import type { Money } from '@/lib/core/money'

const SUPPORTED_STRIPE_CURRENCY_EXPONENTS = new Set([0, 2, 3])
const currencyExponentCache = new Map<string, number | null>()

function getCurrencyExponent(currencyCode: string) {
  const normalizedCurrencyCode = currencyCode.trim().toUpperCase()
  const cachedExponent = currencyExponentCache.get(normalizedCurrencyCode)

  if (cachedExponent !== undefined) {
    return cachedExponent
  }

  if (!normalizedCurrencyCode) {
    currencyExponentCache.set(normalizedCurrencyCode, null)
    return null
  }

  try {
    const exponent = new Intl.NumberFormat('en-US', {
      currency: normalizedCurrencyCode,
      style: 'currency',
    }).resolvedOptions().maximumFractionDigits

    if (typeof exponent !== 'number') {
      currencyExponentCache.set(normalizedCurrencyCode, null)
      return null
    }

    currencyExponentCache.set(normalizedCurrencyCode, exponent)
    return exponent
  } catch {
    currencyExponentCache.set(normalizedCurrencyCode, null)
    return null
  }
}

export function isStripeExpressCheckoutCurrencySupported(currencyCode: string) {
  const exponent = getCurrencyExponent(currencyCode)

  return exponent !== null && SUPPORTED_STRIPE_CURRENCY_EXPONENTS.has(exponent)
}

export function toStripeMinorUnit(money: Money) {
  if (!Number.isFinite(money.amount)) {
    throw new TypeError(
      `Expected a finite money amount, received ${String(money.amount)}`,
    )
  }

  const exponent = getCurrencyExponent(money.currencyCode)

  if (exponent === null || !SUPPORTED_STRIPE_CURRENCY_EXPONENTS.has(exponent)) {
    throw new RangeError(
      `Stripe Express Checkout does not support currency exponent ${String(exponent)} for ${money.currencyCode}`,
    )
  }

  return Math.round(money.amount * 10 ** exponent)
}
