type CompletedOrderAccessResource = {
  id: string
  token?: unknown
}

function normalizeAccessToken(token: unknown) {
  const normalizedToken = typeof token === 'string' ? token.trim() : undefined

  return normalizedToken || undefined
}

function readResourceToken(resource: CompletedOrderAccessResource) {
  return normalizeAccessToken(resource.token)
}

export function buildCompletedOrderAccess({
  fallbackToken,
  order,
  orderIds,
}: {
  fallbackToken?: string
  order: CompletedOrderAccessResource
  orderIds: string[]
}) {
  return {
    orderIds: [...orderIds, order.id],
    orderToken: readResourceToken(order) ?? normalizeAccessToken(fallbackToken),
  }
}

export function getCompletedOrderLookupRequestOptions(orderToken: string) {
  const normalizedToken = normalizeAccessToken(orderToken)

  return {
    ...(normalizedToken ? { spreeToken: normalizedToken } : {}),
  }
}

export function getCustomerCompletedOrderLookupRequestOptions(
  customerToken: string,
) {
  const normalizedToken = normalizeAccessToken(customerToken)

  return {
    ...(normalizedToken ? { token: normalizedToken } : {}),
  }
}
