import { isCountryCode } from '@/lib/core/market-format'
import { isNullableDecimalMoneyAmount } from '@/lib/core/decimal-money'
import type { Cart as SpreeCart, Order as SpreeOrder } from '@spree/sdk'

export const CART_PROJECTION_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The cart response is malformed.'
export const CART_PROJECTION_RESPONSE_OWNERSHIP_MISMATCH_MESSAGE =
  'The cart response contains an unrelated fulfillment item.'

export class CartProjectionResponseTypeMismatchError extends Error {
  constructor() {
    super(CART_PROJECTION_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CartProjectionResponseTypeMismatchError'
  }
}

export class CartProjectionResponseOwnershipMismatchError extends Error {
  constructor() {
    super(CART_PROJECTION_RESPONSE_OWNERSHIP_MISMATCH_MESSAGE)
    this.name = 'CartProjectionResponseOwnershipMismatchError'
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNonBlankString(value: unknown): value is string {
  return isString(value) && Boolean(value.trim())
}

function isNullableString(value: unknown): value is string | null {
  return value === null || isString(value)
}

function isAmount(value: unknown): value is string | null {
  return isNullableDecimalMoneyAmount(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeInteger(value: unknown): value is number {
  return isFiniteNumber(value) && Number.isInteger(value) && value >= 0
}

function isAddress(value: unknown) {
  if (value === null) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isNullableString(value.address1) &&
    isNullableString(value.address2) &&
    isNullableString(value.city) &&
    isNullableString(value.company) &&
    isString(value.country_code) &&
    isCountryCode(value.country_code) &&
    isNullableString(value.first_name) &&
    isString(value.full_name) &&
    isNullableString(value.last_name) &&
    isNullableString(value.phone) &&
    isNullableString(value.postal_code) &&
    isNullableString(value.state_code) &&
    isNullableString(value.state_name) &&
    isNullableString(value.state_text)
  )
}

function isOptionValue(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isString(value.label) &&
    isString(value.name) &&
    isNonBlankString(value.option_type_id) &&
    isString(value.option_type_label) &&
    isString(value.option_type_name) &&
    isNonNegativeInteger(value.position) &&
    isNullableString(value.color_code)
  )
}

function isLineItem(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isNonBlankString(value.variant_id) &&
    isNonNegativeInteger(value.quantity) &&
    isString(value.currency) &&
    isString(value.name) &&
    isString(value.slug) &&
    isString(value.options_text) &&
    isAmount(value.price) &&
    isAmount(value.total) &&
    isAmount(value.compare_at_amount) &&
    isNullableString(value.thumbnail_url) &&
    Array.isArray(value.option_values) &&
    value.option_values.every(isOptionValue)
  )
}

function isDeliveryRate(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isNonBlankString(value.delivery_method_id) &&
    isString(value.name) &&
    typeof value.selected === 'boolean' &&
    isAmount(value.cost) &&
    isAmount(value.total)
  )
}

function isPaymentSource(value: unknown, sourceType: unknown) {
  if (value === null) {
    return sourceType === null
  }

  if (!isRecord(value) || !isNonBlankString(value.id)) {
    return false
  }

  switch (sourceType) {
    case 'credit_card':
      return isString(value.last4)
    case 'store_credit':
      return isAmount(value.amount_remaining)
    case 'payment_source':
      return (
        value.id.startsWith('psrc_') &&
        value.id.length > 'psrc_'.length &&
        isNullableString(value.gateway_payment_profile_id)
      )
    default:
      return false
  }
}

function paymentSourceIdMatchesSource(value: unknown, sourceId: unknown) {
  if (value === null) {
    return sourceId === null
  }

  return isRecord(value) && sourceId === value.id
}

function isFulfillment(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isString(value.number) &&
    isAmount(value.cost) &&
    isString(value.status) &&
    isNullableString(value.fulfilled_at) &&
    isRecord(value.delivery_method) &&
    isString(value.delivery_method.name) &&
    Array.isArray(value.items) &&
    value.items.every((item) => {
      if (!isRecord(item)) {
        return false
      }

      return (
        isNonBlankString(item.item_id) &&
        isNonBlankString(item.variant_id) &&
        isNonNegativeInteger(item.quantity)
      )
    }) &&
    Array.isArray(value.delivery_rates) &&
    value.delivery_rates.every(isDeliveryRate)
  )
}

function isDiscount(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isNonBlankString(value.promotion_id) &&
    isString(value.name) &&
    isNullableString(value.description) &&
    isNullableString(value.code) &&
    isAmount(value.amount)
  )
}

function isPayment(value: unknown) {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isNonBlankString(value.payment_method_id) &&
    isAmount(value.amount) &&
    isString(value.number) &&
    isNullableString(value.response_code) &&
    isString(value.status) &&
    isPaymentSource(value.source, value.source_type) &&
    paymentSourceIdMatchesSource(value.source, value.source_id) &&
    isPaymentMethod(value.payment_method) &&
    value.payment_method_id === value.payment_method.id
  )
}

function isPaymentMethod(value: unknown): value is UnknownRecord {
  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isString(value.name) &&
    isNullableString(value.description) &&
    isString(value.type) &&
    typeof value.session_required === 'boolean' &&
    typeof value.source_required === 'boolean'
  )
}

function isRequirement(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.field) &&
    isString(value.message) &&
    isString(value.step)
  )
}

function isGiftCard(value: unknown) {
  if (value === null) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return (
    isNonBlankString(value.id) &&
    isString(value.code) &&
    isString(value.status) &&
    isString(value.currency) &&
    isAmount(value.amount_remaining) &&
    isNullableString(value.expires_at) &&
    typeof value.expired === 'boolean' &&
    typeof value.active === 'boolean'
  )
}

function isProjectionRoot(value: unknown): value is UnknownRecord {
  if (
    !isRecord(value) ||
    !isNonBlankString(value.id) ||
    !isNonBlankString(value.currency) ||
    !isNonNegativeInteger(value.total_quantity) ||
    !isNullableString(value.email) ||
    !isAmount(value.item_total) ||
    !isAmount(value.discount_total) ||
    !isAmount(value.delivery_total) ||
    !isAmount(value.tax_total) ||
    !isAmount(value.total) ||
    !isAmount(value.amount_due) ||
    !isAmount(value.gift_card_total) ||
    !Array.isArray(value.items) ||
    !value.items.every(isLineItem) ||
    !Array.isArray(value.fulfillments) ||
    !value.fulfillments.every(isFulfillment) ||
    !Array.isArray(value.discounts) ||
    !value.discounts.every(isDiscount) ||
    !Array.isArray(value.payments) ||
    !value.payments.every(isPayment) ||
    !isAddress(value.billing_address) ||
    !isAddress(value.shipping_address) ||
    !isGiftCard(value.gift_card)
  ) {
    return false
  }

  const checkoutFields = [
    'current_step',
    'completed_steps',
    'shipping_eq_billing_address',
    'payment_methods',
    'requirements',
  ] as const
  const hasAnyCheckoutField = checkoutFields.some((field) => field in value)
  const hasAllCheckoutFields = checkoutFields.every((field) => field in value)

  if (hasAnyCheckoutField !== hasAllCheckoutFields) {
    return false
  }

  if (hasAllCheckoutFields) {
    if (!isString(value.current_step)) {
      return false
    }

    if (
      !Array.isArray(value.completed_steps) ||
      !value.completed_steps.every(isString)
    ) {
      return false
    }

    if (typeof value.shipping_eq_billing_address !== 'boolean') {
      return false
    }

    if (
      !Array.isArray(value.payment_methods) ||
      !value.payment_methods.every(isPaymentMethod)
    ) {
      return false
    }

    if (
      !Array.isArray(value.requirements) ||
      !value.requirements.every(isRequirement)
    ) {
      return false
    }
  }

  return true
}

function assertFulfillmentOwnership(value: UnknownRecord) {
  const lineItemVariants = new Map(
    (value.items as UnknownRecord[]).map((item) => {
      return [item.id, item.variant_id] as const
    }),
  )

  for (const fulfillment of value.fulfillments as UnknownRecord[]) {
    for (const item of fulfillment.items as UnknownRecord[]) {
      if (
        lineItemVariants.get(item.item_id) !== item.variant_id ||
        !lineItemVariants.has(item.item_id)
      ) {
        throw new CartProjectionResponseOwnershipMismatchError()
      }
    }
  }
}

export function assertSpreeCartProjectionResponse(
  response: unknown,
): asserts response is SpreeCart | SpreeOrder {
  if (!isProjectionRoot(response)) {
    throw new CartProjectionResponseTypeMismatchError()
  }

  assertFulfillmentOwnership(response)
}

export function assertSpreeCheckoutAddressResponse(
  response: unknown,
): asserts response is SpreeCart['billing_address'] {
  if (!isAddress(response)) throw new CartProjectionResponseTypeMismatchError()
}

export function assertSpreePaymentProjectionResponse(
  response: unknown,
): asserts response is SpreeCart['payments'][number] {
  if (!isPayment(response)) throw new CartProjectionResponseTypeMismatchError()
}
