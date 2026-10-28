import { z } from 'zod'

import { checkoutCartInputSchema } from '../session/checkout-session.schemas'

export const applyCheckoutCodeInputSchema = checkoutCartInputSchema.extend({
  code: z.string().trim().min(1).max(255),
})

export const removeCheckoutDiscountCodeInputSchema =
  checkoutCartInputSchema.extend({
    code: z.string().trim().min(1).max(255),
  })

export const removeCheckoutGiftCardInputSchema = checkoutCartInputSchema.extend(
  {
    giftCardId: z.string().trim().min(1).max(255),
  },
)

export type ApplyCheckoutCodeInput = z.infer<
  typeof applyCheckoutCodeInputSchema
>
export type RemoveCheckoutDiscountCodeInput = z.infer<
  typeof removeCheckoutDiscountCodeInputSchema
>
export type RemoveCheckoutGiftCardInput = z.infer<
  typeof removeCheckoutGiftCardInputSchema
>
