import { isNullableDecimalMoneyAmount } from '@/lib/core/decimal-money'
import { isCustomerOrderResourceId } from './order-identity'

export const CUSTOMER_ORDER_SUMMARY_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The customer order summary response is malformed.'

export class CustomerOrderSummaryResponseTypeMismatchError extends Error {
  constructor() {
    super(CUSTOMER_ORDER_SUMMARY_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'CustomerOrderSummaryResponseTypeMismatchError'
  }
}

type CustomerOrderSummaryResponse = {
  completed_at: string | null
  currency: string
  total: string | null
  fulfillment_status: string | null
  id: string
  market_id: string | null
  number: string
  payment_status: string | null
  total_quantity: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  )
}

function isCustomerOrderSummaryResponse(
  value: unknown,
): value is CustomerOrderSummaryResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    isCustomerOrderResourceId(value.id) &&
    isNullableString(value.completed_at) &&
    typeof value.currency === 'string' &&
    isNullableDecimalMoneyAmount(value.total) &&
    isNullableString(value.fulfillment_status) &&
    (value.market_id === null || typeof value.market_id === 'string') &&
    typeof value.number === 'string' &&
    isNullableString(value.payment_status) &&
    isNonNegativeInteger(value.total_quantity)
  )
}

export function assertCustomerOrderSummaryResponse(
  response: unknown,
): asserts response is CustomerOrderSummaryResponse {
  if (!isCustomerOrderSummaryResponse(response)) {
    throw new CustomerOrderSummaryResponseTypeMismatchError()
  }
}
