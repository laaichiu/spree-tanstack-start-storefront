import { isNullableDecimalMoneyAmount } from '@/lib/core/decimal-money'

export const CUSTOMER_GIFT_CARD_RESOURCE_TYPE_MISMATCH_MESSAGE =
  'The response is not a gift card resource.'

export class CustomerGiftCardResourceTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_GIFT_CARD_RESOURCE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerGiftCardResourceTypeMismatchError'
  }
}

type CustomerGiftCardResource = {
  active: boolean
  amount: string | null
  amount_authorized: string | null
  amount_remaining: string | null
  amount_used: string | null
  code: string
  currency: string
  expired: boolean
  expires_at: string | null
  id: string
  redeemed_at: string | null
  status: string
}

export function isCustomerGiftCardResourceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('gc_') &&
    value.length > 'gc_'.length
  )
}

export function assertCustomerGiftCardResourceIsGiftCard(
  resource: unknown,
): asserts resource is CustomerGiftCardResource {
  if (!isGiftCardResource(resource)) {
    throw new CustomerGiftCardResourceTypeMismatchError()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isGiftCardResource(
  resource: unknown,
): resource is CustomerGiftCardResource {
  if (!isRecord(resource)) {
    return false
  }

  return (
    isCustomerGiftCardResourceId(resource.id) &&
    typeof resource.code === 'string' &&
    typeof resource.status === 'string' &&
    typeof resource.currency === 'string' &&
    isNullableDecimalMoneyAmount(resource.amount) &&
    isNullableDecimalMoneyAmount(resource.amount_used) &&
    isNullableDecimalMoneyAmount(resource.amount_authorized) &&
    isNullableDecimalMoneyAmount(resource.amount_remaining) &&
    isNullableString(resource.expires_at) &&
    isNullableString(resource.redeemed_at) &&
    typeof resource.expired === 'boolean' &&
    typeof resource.active === 'boolean'
  )
}
