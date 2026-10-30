import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { CartPageContent } from '@/components/cart/cart-page-content'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

const marketRoute = getRouteApi('/$country/$locale')

export const Route = createFileRoute('/$country/$locale/cart')({
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: getMessageFromMatches(
        matches,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: getMessageFromMatches(matches, 'cart.cart'),
    }),
  component: CartPage,
})

function CartPage() {
  const { capabilities } = marketRoute.useLoaderData()
  const { initialCart, initialLoadError } = capabilities.cart

  return (
    <CartPageContent
      initialCart={initialLoadError ? undefined : initialCart}
      initialCartLoadError={initialLoadError}
    />
  )
}
