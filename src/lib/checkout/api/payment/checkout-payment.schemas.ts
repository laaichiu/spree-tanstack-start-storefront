import { z } from 'zod'

import {
  checkoutCartInputSchema,
  checkoutMarketSchema,
} from '../session/checkout-session.schemas'
import { checkoutShippingRateReferenceSchema } from '../shipping/checkout-shipping.schemas'

const checkoutExternalDataString = z.string().trim().min(1).max(2048)

export const checkoutExternalDataSchema = z
  .object({
    stripe_payment_method_id: checkoutExternalDataString.regex(/^pm_/),
  })
  .partial()
  .strict()

export const createCheckoutPaymentSessionInputSchema = z.object({
  cartId: checkoutCartInputSchema.shape.cartId,
  externalData: checkoutExternalDataSchema.optional(),
  market: checkoutMarketSchema,
  paymentMethodId: z.string().trim().min(1),
  selectedShippingRate: checkoutShippingRateReferenceSchema,
})

export const completeCheckoutPaymentSessionInputSchema = z.object({
  cartId: checkoutCartInputSchema.shape.cartId,
  externalData: checkoutExternalDataSchema.optional(),
  market: checkoutMarketSchema,
  selectedShippingRate: checkoutShippingRateReferenceSchema,
  sessionId: z.string().trim().min(1),
  sessionResult: z.string().trim().min(1).optional(),
})

export const createDirectCheckoutPaymentInputSchema = z.object({
  cartId: checkoutCartInputSchema.shape.cartId,
  market: checkoutMarketSchema,
  paymentMethodId: z.string().trim().min(1),
  selectedShippingRate: checkoutShippingRateReferenceSchema,
})

export type CreateCheckoutPaymentSessionInput = z.infer<
  typeof createCheckoutPaymentSessionInputSchema
>
export type CompleteCheckoutPaymentSessionInput = z.infer<
  typeof completeCheckoutPaymentSessionInputSchema
>
export type CreateDirectCheckoutPaymentInput = z.infer<
  typeof createDirectCheckoutPaymentInputSchema
>
