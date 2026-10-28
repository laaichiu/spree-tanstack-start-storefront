import { isCountryCode } from '@/lib/core/market-format'
import { isNullableDecimalMoneyAmount } from '@/lib/core/decimal-money'

export const CUSTOMER_ORDER_DETAIL_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The customer order detail response is malformed.'
export const CUSTOMER_ORDER_DETAIL_RESPONSE_OWNERSHIP_MISMATCH_MESSAGE =
  'The customer order detail response contains an unrelated resource.'

export class CustomerOrderDetailResponseTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ORDER_DETAIL_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerOrderDetailResponseTypeMismatchError'
  }
}

export class CustomerOrderDetailResponseOwnershipMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ORDER_DETAIL_RESPONSE_OWNERSHIP_MISMATCH_MESSAGE)
    this.name = 'CustomerOrderDetailResponseOwnershipMismatchError'
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireRecord(value: unknown): UnknownRecord {
  if (!isRecord(value)) {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }

  return value
}

function requireArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }

  return value
}

function requireString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }

  return value
}

function requireNullableString(value: unknown): string | null {
  if (value !== null && typeof value !== 'string') {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }

  return value
}

function requireMoney(value: unknown) {
  if (!isNullableDecimalMoneyAmount(value)) {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }
}

function assertOrderAddress(value: unknown) {
  if (value === null) {
    return
  }

  const address = requireRecord(value)

  requireNullableString(address.address1)
  requireNullableString(address.address2)
  requireNullableString(address.city)
  requireNullableString(address.company)
  if (!isCountryCode(requireString(address.country_code))) {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }
  requireString(address.full_name)
  requireNullableString(address.phone)
  requireNullableString(address.postal_code)
  requireNullableString(address.state_text)
}

function assertOrderDetailFields(order: UnknownRecord) {
  const nullableFields = [
    'amount_due',
    'customer_note',
    'discount_total',
    'delivery_total',
    'item_total',
    'gift_card_total',
    'store_credit_total',
    'tax_total',
  ] as const

  nullableFields.forEach((field) => {
    if (field === 'customer_note') requireNullableString(order[field])
    else requireMoney(order[field])
  })
  assertOrderAddress(order.billing_address)
  assertOrderAddress(order.shipping_address)
}

function requireResourceId(value: unknown, prefix: string): string {
  const id = requireString(value)

  if (!id.startsWith(prefix) || id.length === prefix.length) {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }

  return id
}

function requirePositiveInteger(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new CustomerOrderDetailResponseTypeMismatchError()
  }

  return value
}

function assertLineItem(value: unknown) {
  const item = requireRecord(value)
  const id = requireResourceId(item.id, 'li_')
  const variantId = requireResourceId(item.variant_id, 'variant_')

  requireString(item.name)
  requireString(item.slug)
  requireString(item.options_text)
  requirePositiveInteger(item.quantity)
  requireMoney(item.price)
  requireMoney(item.total)
  requireNullableString(item.thumbnail_url)

  return { id, variantId }
}

function assertFulfillmentItem(
  value: unknown,
  lineItemVariants: ReadonlyMap<string, string>,
) {
  const item = requireRecord(value)
  const itemId = requireResourceId(item.item_id, 'li_')
  const variantId = requireResourceId(item.variant_id, 'variant_')

  if (!lineItemVariants.has(itemId)) {
    throw new CustomerOrderDetailResponseOwnershipMismatchError()
  }

  if (lineItemVariants.get(itemId) !== variantId) {
    throw new CustomerOrderDetailResponseOwnershipMismatchError()
  }

  requirePositiveInteger(item.quantity)
}

function assertFulfillment(
  value: unknown,
  lineItemVariants: ReadonlyMap<string, string>,
) {
  const fulfillment = requireRecord(value)

  requireResourceId(fulfillment.id, 'ful_')
  requireString(fulfillment.number)
  requireString(fulfillment.status)
  requireMoney(fulfillment.cost)
  requireNullableString(fulfillment.fulfilled_at)
  requireNullableString(fulfillment.tracking)
  requireNullableString(fulfillment.tracking_url)

  const deliveryMethod = requireRecord(fulfillment.delivery_method)
  requireResourceId(deliveryMethod.id, 'dm_')
  requireString(deliveryMethod.name)

  const stockLocation = requireRecord(fulfillment.stock_location)
  requireResourceId(stockLocation.id, 'sloc_')
  requireString(stockLocation.name)
  requireNullableString(stockLocation.city)
  requireNullableString(stockLocation.country_code)
  requireNullableString(stockLocation.state_code)
  requireNullableString(stockLocation.state_text)

  requireArray(fulfillment.items).forEach((item) =>
    assertFulfillmentItem(item, lineItemVariants),
  )
}

function assertPaymentSource(value: unknown, sourceType: unknown) {
  if (value === null) {
    if (sourceType !== null) {
      throw new CustomerOrderDetailResponseTypeMismatchError()
    }

    return
  }

  const source = requireRecord(value)
  const normalizedSourceType = requireString(sourceType)

  if (normalizedSourceType === 'credit_card') {
    requireResourceId(source.id, 'card_')
    requireString(source.last4)
    return
  }

  if (normalizedSourceType === 'store_credit') {
    requireResourceId(source.id, 'credit_')
    requireMoney(source.amount_remaining)
    return
  }

  if (normalizedSourceType === 'payment_source') {
    requireResourceId(source.id, 'psrc_')
    return
  }

  throw new CustomerOrderDetailResponseTypeMismatchError()
}

function assertPayment(value: unknown) {
  const payment = requireRecord(value)

  requireResourceId(payment.id, 'py_')
  requireResourceId(payment.payment_method_id, 'pm_')
  requireString(payment.number)
  requireString(payment.status)
  requireMoney(payment.amount)
  requireNullableString(payment.response_code)

  const paymentMethod = requireRecord(payment.payment_method)
  const paymentMethodId = requireResourceId(paymentMethod.id, 'pm_')
  requireString(paymentMethod.name)

  if (payment.payment_method_id !== paymentMethodId) {
    throw new CustomerOrderDetailResponseOwnershipMismatchError()
  }

  assertPaymentSource(payment.source, payment.source_type)
  const sourceId = requireNullableString(payment.source_id)
  const expandedSourceId =
    payment.source === null ? null : requireRecord(payment.source).id

  if (sourceId !== expandedSourceId) {
    throw new CustomerOrderDetailResponseOwnershipMismatchError()
  }
}

export function assertCustomerOrderDetailResponse(response: unknown) {
  const order = requireRecord(response)
  assertOrderDetailFields(order)
  const lineItemVariants = new Map<string, string>()

  requireArray(order.items).forEach((item) => {
    const { id, variantId } = assertLineItem(item)

    if (lineItemVariants.has(id)) {
      throw new CustomerOrderDetailResponseOwnershipMismatchError()
    }

    lineItemVariants.set(id, variantId)
  })

  requireArray(order.fulfillments).forEach((fulfillment) =>
    assertFulfillment(fulfillment, lineItemVariants),
  )
  requireArray(order.payments).forEach(assertPayment)
}
