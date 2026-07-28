const checkoutShellRouteIds = new Set([
  '/$country/$locale/confirm-payment/$id',
  '/$country/$locale/checkout/',
  '/$country/$locale/checkout/$id',
  '/$country/$locale/order-placed/$id',
])

const checkoutShellPathPattern =
  /^\/[^/]+\/[^/]+\/(?:checkout|confirm-payment|order-placed)(?:\/|$)/

export function isCheckoutShellPath(pathname: string) {
  return checkoutShellPathPattern.test(pathname)
}

export function isCheckoutShellRouteId(routeId: string) {
  return checkoutShellRouteIds.has(routeId)
}
