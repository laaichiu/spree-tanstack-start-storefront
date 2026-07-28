import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'

import type {
  ApplyCheckoutCodeInput,
  RemoveCheckoutDiscountCodeInput,
  RemoveCheckoutGiftCardInput,
} from './checkout-code.schemas'
import {
  applyCheckoutCodeToCart,
  removeCheckoutDiscountCodeFromCart,
  removeCheckoutGiftCardFromCart,
} from './checkout-code.server'
import type {
  ApplyCheckoutCodeResult,
  RemoveCheckoutCodeResult,
} from './checkout-code.server'
import { getCheckoutCartCookieStateForMarket } from '../checkout-session.server'

export const applyCheckoutCode = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as ApplyCheckoutCodeInput)
  .handler(async ({ data }): Promise<ApplyCheckoutCodeResult> => {
    const { applyCheckoutCodeInputSchema } =
      await import('./checkout-code.schemas')
    const input = applyCheckoutCodeInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return applyCheckoutCodeToCart({
      cartId: input.cartId,
      cartToken,
      code: input.code,
      market,
    })
  })

export const removeCheckoutDiscountCode = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as RemoveCheckoutDiscountCodeInput)
  .handler(async ({ data }): Promise<RemoveCheckoutCodeResult> => {
    const { removeCheckoutDiscountCodeInputSchema } =
      await import('./checkout-code.schemas')
    const input = removeCheckoutDiscountCodeInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return removeCheckoutDiscountCodeFromCart({
      cartId: input.cartId,
      cartToken,
      code: input.code,
      market,
    })
  })

export const removeCheckoutGiftCard = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as RemoveCheckoutGiftCardInput)
  .handler(async ({ data }): Promise<RemoveCheckoutCodeResult> => {
    const { removeCheckoutGiftCardInputSchema } =
      await import('./checkout-code.schemas')
    const input = removeCheckoutGiftCardInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return removeCheckoutGiftCardFromCart({
      cartId: input.cartId,
      cartToken,
      giftCardId: input.giftCardId,
      market,
    })
  })
