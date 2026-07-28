export type CheckoutPaymentReturnSearch = {
  redirectResult?: string
  session?: string
  sessionId?: string
  sessionResult?: string
}

function readOptionalSearchString(
  search: Record<string, unknown>,
  key: keyof CheckoutPaymentReturnSearch,
) {
  const value = search[key]

  return typeof value === 'string' && value.trim() ? value : undefined
}

export function parseCheckoutPaymentReturnSearch(
  search: Record<string, unknown>,
): CheckoutPaymentReturnSearch {
  return {
    redirectResult: readOptionalSearchString(search, 'redirectResult'),
    session: readOptionalSearchString(search, 'session'),
    sessionId: readOptionalSearchString(search, 'sessionId'),
    sessionResult: readOptionalSearchString(search, 'sessionResult'),
  }
}
