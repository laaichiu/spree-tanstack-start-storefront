import type { OrderGroup } from '@spree/sdk'

import {
  assertSpreeCartProjectionResponse,
  assertSpreeCheckoutAddressResponse,
  assertSpreePaymentProjectionResponse,
} from '@/lib/cart/mappers/cart-projection-response'
import { isCheckoutOrderGroupResourceId } from '../utils/order-resource-identity'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function assertCheckoutOrderGroupResponse(
  response: unknown,
): asserts response is OrderGroup {
  if (!isRecord(response)) {
    throw new Error('The checkout order group response is malformed.')
  }

  if (
    !isCheckoutOrderGroupResourceId(response.id) ||
    typeof response.number !== 'string' ||
    !response.number.trim() ||
    typeof response.currency !== 'string' ||
    !response.currency.trim() ||
    !Array.isArray(response.orders) ||
    response.orders.length === 0 ||
    !Array.isArray(response.payments)
  )
    throw new Error('The checkout order group response is malformed.')

  for (const field of [
    'email',
    'completed_at',
    'fulfillment_status',
    'payment_status',
  ]) {
    if (response[field] !== null && typeof response[field] !== 'string') {
      throw new Error('The checkout order group response is malformed.')
    }
  }
  for (const field of [
    'item_total',
    'total',
    'amount_due',
    'discount_total',
    'delivery_total',
    'tax_total',
  ]) {
    const value = response[field]
    if (
      value !== null &&
      (typeof value !== 'string' ||
        !/^-?\d+(?:\.\d+)?$/.test(value) ||
        !Number.isFinite(Number(value)))
    ) {
      throw new Error('The checkout order group response is malformed.')
    }
  }

  assertSpreeCheckoutAddressResponse(response.billing_address)
  assertSpreeCheckoutAddressResponse(response.shipping_address)
  response.payments.forEach(assertSpreePaymentProjectionResponse)
  response.orders.forEach(assertSpreeCartProjectionResponse)
}
