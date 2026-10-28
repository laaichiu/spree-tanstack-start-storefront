import { z } from 'zod'

import {
  checkoutCartInputSchema,
  checkoutMarketSchema,
} from '../session/checkout-session.schemas'
import { checkoutShippingRateReferenceSchema } from '../shipping/checkout-shipping.schemas'
import { isCheckoutOrderLookupId } from '../../utils/order-resource-identity'
import { isPaymentSessionResourceId } from '../../utils/payment/payment-session-identity'

export const completedCheckoutOrderInputSchema = z.object({
  market: checkoutMarketSchema,
  orderId: z
    .string()
    .trim()
    .refine(
      isCheckoutOrderLookupId,
      'Expected a Cart, Order, or OrderGroup resource id.',
    ),
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
  sessionId: z
    .string()
    .trim()
    .refine(
      isPaymentSessionResourceId,
      'Expected a PaymentSession resource id.',
    )
    .optional(),
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
