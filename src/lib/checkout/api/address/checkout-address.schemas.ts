import { z } from 'zod'

import {
  checkoutAddressSchema,
  checkoutBillingAddressSchema,
} from '@/lib/checkout/validation/address'

import {
  checkoutCartIdSchema,
  checkoutMarketSchema,
} from '../session/checkout-session.schemas'

export const updateCheckoutAddressInputSchema = z
  .object({
    address: checkoutAddressSchema.optional(),
    cartId: checkoutCartIdSchema.optional(),
    email: z.preprocess(
      (value) =>
        typeof value === 'string' && !value.trim() ? undefined : value,
      z.string().trim().email().optional(),
    ),
    market: checkoutMarketSchema,
    shippingAddressId: z.string().trim().min(1).optional(),
  })
  .superRefine((data, context) => {
    if (!data.address && !data.shippingAddressId) {
      context.addIssue({
        code: 'custom',
        message: 'Delivery address is required.',
        path: ['address'],
      })
    }
  })

export const updateCheckoutBillingAddressInputSchema = z
  .object({
    billingAddress: checkoutBillingAddressSchema.optional(),
    cartId: checkoutCartIdSchema,
    market: checkoutMarketSchema,
    useShipping: z.boolean(),
  })
  .superRefine((data, context) => {
    if (!data.useShipping && !data.billingAddress) {
      context.addIssue({
        code: 'custom',
        message: 'Billing address is required.',
        path: ['billingAddress'],
      })
    }
  })

export type UpdateCheckoutAddressInput = z.infer<
  typeof updateCheckoutAddressInputSchema
>
export type UpdateCheckoutBillingAddressInput = z.infer<
  typeof updateCheckoutBillingAddressInputSchema
>
