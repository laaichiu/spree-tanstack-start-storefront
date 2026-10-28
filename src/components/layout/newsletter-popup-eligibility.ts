export function isNewsletterPopupRouteExcluded(pathname: string) {
  return (
    pathname.includes('/account') ||
    pathname.endsWith('/cart') ||
    pathname.includes('/checkout') ||
    pathname.includes('/newsletter/')
  )
}
