import { z } from 'zod'

import {
  checkoutCartInputSchema,
  checkoutMarketSchema,
} from '../session/checkout-session.schemas'
import { checkoutShippingRateReferenceSchema } from '../shipping/checkout-shipping.schemas'
import { isPaymentSessionResourceId } from '../../utils/payment/payment-session-identity'

const checkoutPaymentSessionInputString = z.string().trim().min(1).max(2048)
const checkoutPaymentSessionId = z
  .string()
  .trim()
  .refine(isPaymentSessionResourceId, 'Expected a PaymentSession resource id.')

export const checkoutPaymentSessionInputDataSchema = z
  .object({
    stripePaymentMethodId: checkoutPaymentSessionInputString
      .regex(/^pm_/)
      .optional(),
  })
  .strict()
  .optional()

export const createCheckoutPaymentSessionInputSchema = z
  .object({
    cartId: checkoutCartInputSchema.shape.cartId,
    paymentData: checkoutPaymentSessionInputDataSchema,
    market: checkoutMarketSchema,
    paymentMethodId: z.string().trim().min(1),
    selectedShippingRate: checkoutShippingRateReferenceSchema,
  })
  .strict()

export const completeCheckoutPaymentSessionInputSchema = z
  .object({
    cartId: checkoutCartInputSchema.shape.cartId,
    market: checkoutMarketSchema,
    selectedShippingRate: checkoutShippingRateReferenceSchema,
    sessionId: checkoutPaymentSessionId,
    sessionResult: z.string().trim().min(1).optional(),
  })
  .strict()

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
