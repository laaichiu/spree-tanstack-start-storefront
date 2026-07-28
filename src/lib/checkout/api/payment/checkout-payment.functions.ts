import { createServerFn } from '@tanstack/react-start'

import { resolveServerMarket } from '@/lib/market/api/resolve-server-market'

import type {
  CompleteCheckoutPaymentSessionInput,
  CreateCheckoutPaymentSessionInput,
  CreateDirectCheckoutPaymentInput,
} from './checkout-payment.schemas'
import {
  completeCheckoutPaymentSessionOnServer,
  createCheckoutPaymentSessionOnServer,
  createDirectCheckoutPaymentOnServer,
} from './checkout-payment.server'
import { getCheckoutCartCookieStateForMarket } from '../checkout-session.server'

export const createCheckoutPaymentSession = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as CreateCheckoutPaymentSessionInput)
  .handler(async ({ data }) => {
    const { createCheckoutPaymentSessionInputSchema } =
      await import('./checkout-payment.schemas')
    const input = createCheckoutPaymentSessionInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return createCheckoutPaymentSessionOnServer({
      cartId: input.cartId,
      cartToken,
      externalData: input.externalData,
      market,
      paymentMethodId: input.paymentMethodId,
      selectedShippingRate: input.selectedShippingRate,
    })
  })

export const completeCheckoutPaymentSession = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as CompleteCheckoutPaymentSessionInput)
  .handler(async ({ data }) => {
    const { completeCheckoutPaymentSessionInputSchema } =
      await import('./checkout-payment.schemas')
    const input = completeCheckoutPaymentSessionInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return completeCheckoutPaymentSessionOnServer({
      cartId: input.cartId,
      cartToken,
      externalData: input.externalData,
      market,
      selectedShippingRate: input.selectedShippingRate,
      sessionId: input.sessionId,
      sessionResult: input.sessionResult,
    })
  })

export const createDirectCheckoutPayment = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data as CreateDirectCheckoutPaymentInput)
  .handler(async ({ data }) => {
    const { createDirectCheckoutPaymentInputSchema } =
      await import('./checkout-payment.schemas')
    const input = createDirectCheckoutPaymentInputSchema.parse(data)
    const market = await resolveServerMarket(input.market)
    const { cartToken } = getCheckoutCartCookieStateForMarket(market)

    return createDirectCheckoutPaymentOnServer({
      cartId: input.cartId,
      cartToken,
      market,
      paymentMethodId: input.paymentMethodId,
      selectedShippingRate: input.selectedShippingRate,
    })
  })
