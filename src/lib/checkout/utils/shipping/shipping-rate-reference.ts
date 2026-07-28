import type { CartShippingRate } from '@/lib/cart/model/cart'

export type CheckoutShippingRateReferenceInput =
  | {
      deliveryMethodId?: string
      fulfillmentId: string
      id: string
    }
  | null
  | undefined

export type CheckoutShippingRateReference = Exclude<
  CheckoutShippingRateReferenceInput,
  null
>

export function serializeCheckoutShippingRateReference(
  rate: CartShippingRate | null | undefined,
): Exclude<CheckoutShippingRateReferenceInput, null | undefined> | undefined {
  return rate
    ? {
        deliveryMethodId: rate.deliveryMethodId,
        fulfillmentId: rate.fulfillmentId,
        id: rate.id,
      }
    : undefined
}
