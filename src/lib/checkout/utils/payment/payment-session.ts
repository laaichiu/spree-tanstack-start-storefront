import type {
  CheckoutJsonValue,
  CheckoutOrder,
  CheckoutPaymentMethod,
} from '@/lib/checkout/model/checkout'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/utils/payment/saved-payment-card'
import { isCheckoutSavedPaymentProfileAvailable } from '@/lib/checkout/utils/payment/saved-payment-card'
import { redactSensitiveText } from '@/lib/observability/report-error'

import { getSelectedCheckoutShippingRate } from '../shipping/shipping-rate-selection'

const PAYMENT_PROVIDER_CONFIG_ERROR_PATTERNS = [
  /api[_\s-]?key/i,
  /secret[_\s-]?key/i,
  /publishable[_\s-]?key/i,
  /expired\s+api/i,
  /invalid\s+api/i,
]
const PAYMENT_PROVIDER_INTERNAL_ID_PATTERN =
  /\b(?:acct|ch|cus|pm|pi|seti|src|tok)_[A-Za-z0-9]+\b/

function readStringField(
  record: Record<string, CheckoutJsonValue>,
  keys: readonly string[],
) {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

export function readStripeClientSecret(
  externalData: Record<string, CheckoutJsonValue>,
) {
  return readStringField(externalData, [
    'client_secret',
    'clientSecret',
    'payment_intent_client_secret',
  ])
}

export function redactPaymentProviderSecrets(message: string) {
  return redactSensitiveText(message)
}

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function readErrorRecord(error: unknown) {
  return error && typeof error === 'object'
    ? (error as Record<string, unknown>)
    : null
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
  const text = collectPaymentProviderErrorText(error, message)

  return PAYMENT_PROVIDER_CONFIG_ERROR_PATTERNS.some((pattern) =>
    pattern.test(text),
  )
}

export function readSafePaymentSessionErrorMessage(
  error: unknown,
  fallback: string,
) {
  const message = readErrorMessage(error, fallback)

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
  order,
  paymentMethod,
  savedPaymentMethodId = null,
}: {
  order: CheckoutOrder
  paymentMethod: CheckoutPaymentMethod
  savedPaymentMethodId?: string | null
}) {
  const selectedShippingRate = getSelectedCheckoutShippingRate(order)

  return [
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

export function getCheckoutPaymentSessionExternalData({
  savedStripePaymentMethodId,
}: {
  savedStripePaymentMethodId?: string | null
}): Record<string, CheckoutJsonValue> {
  const normalizedSavedPaymentMethodId =
    savedStripePaymentMethodId?.trim() ?? ''

  return {
    ...(normalizedSavedPaymentMethodId
      ? {
          stripe_payment_method_id: normalizedSavedPaymentMethodId,
        }
      : {}),
  }
}

export function isFailedPaymentSessionStatus(status: string) {
  return ['canceled', 'cancelled', 'failed', 'failure'].includes(
    status.toLowerCase(),
  )
}
