import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import { CartPageContent } from '@/components/cart/cart-page-content'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

const marketRoute = getRouteApi('/$country/$locale')

export const Route = createFileRoute('/$country/$locale/cart')({
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: translateMessage(params.locale, 'cart.cart'),
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
