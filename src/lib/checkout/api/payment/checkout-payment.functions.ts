import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'

import {
  completeCheckoutPaymentSessionOnServer,
  createCheckoutPaymentSessionOnServer,
  createDirectCheckoutPaymentOnServer,
} from './checkout-payment.server'
import { requireCheckoutCartCookieStateForCart } from '../checkout-session.server'

export const createCheckoutPaymentSession = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { createCheckoutPaymentSessionInputSchema } =
      await import('./checkout-payment.schemas')
    const input = createCheckoutPaymentSessionInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )

    return createCheckoutPaymentSessionOnServer({
      cartId: input.cartId,
      cartToken,
      paymentData: input.paymentData,
      market,
      paymentMethodId: input.paymentMethodId,
      selectedShippingRate: input.selectedShippingRate,
    })
  })

export const completeCheckoutPaymentSession = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { completeCheckoutPaymentSessionInputSchema } =
      await import('./checkout-payment.schemas')
    const input = completeCheckoutPaymentSessionInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )

    return completeCheckoutPaymentSessionOnServer({
      cartId: input.cartId,
      cartToken,
      market,
      selectedShippingRate: input.selectedShippingRate,
      sessionId: input.sessionId,
      sessionResult: input.sessionResult,
    })
  })

export const createDirectCheckoutPayment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { createDirectCheckoutPaymentInputSchema } =
      await import('./checkout-payment.schemas')
    const input = createDirectCheckoutPaymentInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = requireCheckoutCartCookieStateForCart(
      market,
      input.cartId,
    )

    return createDirectCheckoutPaymentOnServer({
      cartId: input.cartId,
      cartToken,
      market,
      paymentMethodId: input.paymentMethodId,
      selectedShippingRate: input.selectedShippingRate,
    })
  })
