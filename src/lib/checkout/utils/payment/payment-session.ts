import type {
  CheckoutOrder,
  CheckoutPaymentMethod,
  CheckoutSavedPaymentCard,
} from '@/lib/checkout/contracts'
import {
  getSelectedCheckoutShippingRate,
  isCheckoutSavedPaymentProfileAvailable,
} from '@/lib/checkout/contracts'
import type {
  CheckoutPaymentSessionInputData,
  CheckoutPaymentSessionProviderData,
} from './payment-session-contract'
import {
  isUnsafeErrorMessage,
  readErrorMessageText,
} from '@/lib/observability/error-message-safety'
import { redactSensitiveText } from '@/lib/observability/error-redaction'
import type { MarketSelectionInput } from '@/lib/core/market'

const PAYMENT_PROVIDER_INTERNAL_ID_PATTERN =
  /\b(?:acct|cart|ch|cus|fulfillment|li|line_item|order|or|payment|pm|pi|ps|py|rate|session|seti|src|tok|variant)_[A-Za-z0-9]+\b/i

export function readStripeClientSecret(
  providerData: CheckoutPaymentSessionProviderData,
) {
  return providerData.clientSecret ?? undefined
}

export function redactPaymentProviderSecrets(message: string) {
  return redactSensitiveText(message)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readErrorRecord(error: unknown) {
  return isRecord(error) ? error : null
}

function collectPaymentProviderErrorText(error: unknown, message: string) {
  const fields = [message]
  const record = readErrorRecord(error)

  if (record) {
    for (const key of ['code', 'error_code', 'type']) {
      const value = record[key]

      if (typeof value === 'string') {
        fields.push(value)
      }
    }

    const raw = readErrorRecord(record.raw)

    if (raw) {
      for (const key of ['code', 'message', 'type']) {
        const value = raw[key]

        if (typeof value === 'string') {
          fields.push(value)
        }
      }
    }
  }

  if (error instanceof Error) {
    fields.push(error.name)
  }

  return fields.join(' ')
}

function isPaymentProviderConfigurationError(error: unknown, message: string) {
  const text = redactSensitiveText(
    collectPaymentProviderErrorText(error, message),
  )

  return isUnsafeErrorMessage(text)
}

export function readSafePaymentSessionErrorMessage(
  error: unknown,
  fallback: string,
) {
  const message = readErrorMessageText(error) ?? fallback

  if (
    isPaymentProviderConfigurationError(error, message) ||
    PAYMENT_PROVIDER_INTERNAL_ID_PATTERN.test(message)
  ) {
    return fallback
  }

  return redactPaymentProviderSecrets(message)
}

export function getCheckoutPaymentReturnUrl({
  cartId,
  country,
  locale,
  sessionId,
}: {
  cartId: string
  country: string
  locale: string
  sessionId?: string
}) {
  const path = `/${country}/${locale}/confirm-payment/${cartId}`
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  const url = new URL(path, origin || 'http://localhost')

  if (sessionId) {
    url.searchParams.set('session', sessionId)
  }

  return origin ? url.toString() : `${path}${url.search}`
}

export function getCheckoutPaymentSessionKey({
  market,
  order,
  paymentMethod,
  savedPaymentMethodId = null,
}: {
  market: Pick<MarketSelectionInput, 'country' | 'locale'>
  order: CheckoutOrder
  paymentMethod: CheckoutPaymentMethod
  savedPaymentMethodId?: string | null
}) {
  const selectedShippingRate = getSelectedCheckoutShippingRate(order)

  return [
    market.country,
    market.locale,
    order.id,
    paymentMethod.id,
    paymentMethod.gatewayId,
    paymentMethod.sessionRequired ? 'session' : 'direct',
    order.currencyCode,
    selectedShippingRate?.fulfillmentId ?? '',
    selectedShippingRate?.id ?? '',
    order.itemTotal?.amount ?? '',
    order.deliveryTotal?.amount ?? '',
    order.taxTotal?.amount ?? '',
    order.total?.amount ?? '',
    order.amountDue?.amount ?? '',
    savedPaymentMethodId?.trim() ?? '',
  ].join(':')
}

export function getCheckoutSavedStripePaymentMethodId({
  paymentMethod,
  savedPaymentCards,
  selectedPaymentProfileId,
}: {
  paymentMethod: CheckoutPaymentMethod | null
  savedPaymentCards: Array<CheckoutSavedPaymentCard>
  selectedPaymentProfileId: string | null
}) {
  if (!paymentMethod?.sessionRequired || paymentMethod.gatewayId !== 'stripe') {
    return null
  }

  return isCheckoutSavedPaymentProfileAvailable({
    cards: savedPaymentCards,
    paymentProfileId: selectedPaymentProfileId,
  })
    ? selectedPaymentProfileId
    : null
}

export function getCheckoutPaymentSessionInputData({
  savedStripePaymentMethodId,
}: {
  savedStripePaymentMethodId?: string | null
}): CheckoutPaymentSessionInputData {
  const normalizedSavedPaymentMethodId =
    savedStripePaymentMethodId?.trim() ?? ''

  return {
    ...(normalizedSavedPaymentMethodId
      ? {
          stripePaymentMethodId: normalizedSavedPaymentMethodId,
        }
      : {}),
  }
}

export function isCompletedPaymentSessionStatus(status: unknown) {
  return (
    typeof status === 'string' && status.trim().toLowerCase() === 'completed'
  )
}
