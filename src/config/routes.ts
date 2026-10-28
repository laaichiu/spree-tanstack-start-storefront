/**
 * Root-level market routes are shared with the optional Seller/Brand profile
 * route. Keep this list explicit so a backend seller slug can never shadow a
 * storefront route.
 */
export const RESERVED_MARKET_ROUTE_SEGMENTS = [
  'account',
  'api',
  'brands',
  'cart',
  'checkout',
  'collections',
  'confirm-payment',
  'newsletter',
  'order-placed',
  'policies',
  'products',
  'search',
] as const

export function isReservedMarketRouteSegment(segment: string) {
  const normalizedSegment = segment.trim().toLowerCase()

  return RESERVED_MARKET_ROUTE_SEGMENTS.some(
    (reservedSegment) => reservedSegment === normalizedSegment,
  )
}
