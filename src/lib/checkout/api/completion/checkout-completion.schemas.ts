import { z } from 'zod'

import {
  checkoutCartInputSchema,
  checkoutMarketSchema,
} from '../session/checkout-session.schemas'
import { checkoutShippingRateReferenceSchema } from '../shipping/checkout-shipping.schemas'

export const completedCheckoutOrderInputSchema = z.object({
  market: checkoutMarketSchema,
  orderId: z.string().trim().min(1),
})

export const completeCheckoutOrderInputSchema = z.object({
  cartId: checkoutCartInputSchema.shape.cartId,
  market: checkoutMarketSchema,
  selectedShippingRate: checkoutShippingRateReferenceSchema,
})

export const confirmCheckoutPaymentInputSchema = z.object({
  adyenSessionId: z.string().trim().min(1).optional(),
  cartId: checkoutCartInputSchema.shape.cartId,
  market: checkoutMarketSchema,
  redirectResult: z.string().trim().min(1).optional(),
  sessionId: z.string().trim().min(1).optional(),
  sessionResult: z.string().trim().min(1).optional(),
})

export type CompletedCheckoutOrderInput = z.infer<
  typeof completedCheckoutOrderInputSchema
>
export type CompleteCheckoutOrderInput = z.infer<
  typeof completeCheckoutOrderInputSchema
>
export type ConfirmCheckoutPaymentInput = z.infer<
  typeof confirmCheckoutPaymentInputSchema
>
