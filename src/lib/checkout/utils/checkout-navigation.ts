type CheckoutMarketRouteParams = {
  cartId: string
  country: string
  locale: string
  sessionId?: string
}

export type CheckoutPaymentErrorSearch = {
  payment_error: undefined
  payment_error_code: undefined
}

export type CheckoutRouteNavigation = {
  params: {
    country: string
    id: string
    locale: string
  }
  replace: true
  search: CheckoutPaymentErrorSearch
  to: '/$country/$locale/checkout/$id'
}

export type ConfirmPaymentRouteNavigation = {
  params: {
    country: string
    id: string
    locale: string
  }
  replace: true
  search: {
    session: string | undefined
  }
  to: '/$country/$locale/confirm-payment/$id'
}

export type OrderPlacedRouteNavigation = {
  params: {
    country: string
    id: string
    locale: string
  }
  replace: true
  to: '/$country/$locale/order-placed/$id'
}

export function getCheckoutPath({
  cartId,
  country,
  locale,
}: CheckoutMarketRouteParams) {
  return `/${country}/${locale}/checkout/${cartId}`
}

export function getClearCheckoutPaymentErrorSearch(): CheckoutPaymentErrorSearch {
  return {
    payment_error: undefined,
    payment_error_code: undefined,
  }
}

export function getCheckoutRouteNavigation({
  cartId,
  country,
  locale,
}: CheckoutMarketRouteParams): CheckoutRouteNavigation {
  return {
    params: {
      country,
      id: cartId,
      locale,
    },
    replace: true,
    search: getClearCheckoutPaymentErrorSearch(),
    to: '/$country/$locale/checkout/$id',
  }
}

export function getConfirmPaymentRouteNavigation({
  cartId,
  country,
  locale,
  sessionId,
}: CheckoutMarketRouteParams): ConfirmPaymentRouteNavigation {
  return {
    params: {
      country,
      id: cartId,
      locale,
    },
    replace: true,
    search: {
      session: sessionId,
    },
    to: '/$country/$locale/confirm-payment/$id',
  }
}

export function getOrderPlacedRouteNavigation({
  country,
  locale,
  orderId,
}: Omit<CheckoutMarketRouteParams, 'cartId'> & {
  orderId: string
}): OrderPlacedRouteNavigation {
  return {
    params: {
      country,
      id: orderId,
      locale,
    },
    replace: true,
    to: '/$country/$locale/order-placed/$id',
  }
}
