type PaymentSessionMarket = {
  currencyCode?: string | null
}

export const PAYMENT_SESSION_MARKET_MISMATCH_MESSAGE =
  'This payment session belongs to a different market.'

export class PaymentSessionMarketMismatchError extends Error {
  constructor(message = PAYMENT_SESSION_MARKET_MISMATCH_MESSAGE) {
    super(message)
    this.name = 'PaymentSessionMarketMismatchError'
  }
}

export function isPaymentSessionMarketMismatchError(
  error: unknown,
): error is PaymentSessionMarketMismatchError {
  return error instanceof PaymentSessionMarketMismatchError
}

export function assertPaymentSessionMatchesMarket(
  session: unknown,
  market: PaymentSessionMarket,
) {
  const sessionCurrency =
    session && typeof session === 'object' && 'currency' in session
      ? typeof session.currency === 'string'
        ? session.currency.trim().toUpperCase()
        : undefined
      : undefined
  const expectedCurrency = market.currencyCode?.trim().toUpperCase()

  if (
    !sessionCurrency ||
    !expectedCurrency ||
    sessionCurrency !== expectedCurrency
  ) {
    throw new PaymentSessionMarketMismatchError()
  }
}
