type CompletedOrderAccessResource = {
  id: string
  token?: unknown
}

function readResourceToken(resource: CompletedOrderAccessResource) {
  return typeof resource.token === 'string' && resource.token.trim()
    ? resource.token
    : undefined
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
    orderToken: readResourceToken(order) ?? fallbackToken,
  }
}

export function getCompletedOrderLookupRequestOptions(orderToken: string) {
  return {
    spreeToken: orderToken,
  }
}

export function getCustomerCompletedOrderLookupRequestOptions(
  customerToken: string,
) {
  return {
    token: customerToken,
  }
}
