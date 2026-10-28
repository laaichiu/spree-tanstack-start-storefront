import type { CartShippingRate } from '../../cart/contracts'

export type CheckoutShippingRateReference = {
  deliveryMethodId?: string
  fulfillmentId: string
  id: string
}

export function getCheckoutShippingRateIdentity(
  rate: Pick<CheckoutShippingRateReference, 'fulfillmentId' | 'id'>,
) {
  return `${rate.fulfillmentId}:${rate.id}`
}

export function serializeCheckoutShippingRateReference(
  rate:
    | Pick<CartShippingRate, 'deliveryMethodId' | 'fulfillmentId' | 'id'>
    | null
    | undefined,
): CheckoutShippingRateReference | undefined {
  return rate
    ? {
        deliveryMethodId: rate.deliveryMethodId,
        fulfillmentId: rate.fulfillmentId,
        id: rate.id,
      }
    : undefined
}
