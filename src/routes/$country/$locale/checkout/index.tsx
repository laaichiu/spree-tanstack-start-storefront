import { createFileRoute, redirect } from '@tanstack/react-router'

import { getCart } from '@/lib/cart/api/cart-read.functions'
import { CheckoutEntryState } from '@/components/checkout/checkout-entry-state'
import { CheckoutRouteErrorState } from '@/components/checkout/checkout-route-error-state'
import { translateMessage } from '@/lib/i18n/messages'
import { reportError } from '@/lib/observability/report-error'
import { buildSeoMeta } from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/checkout/')({
  loader: async ({ params }) => {
    const cartResult = await getCart({
      data: {
        market: {
          country: params.country,
          locale: params.locale,
        },
      },
    }).then(
      (cart) => ({
        cart,
        cartLoadError: null,
      }),
      (error: unknown) => {
        reportError({
          context: 'checkout.cart',
          error,
        })

        return {
          cart: null,
          cartLoadError: translateMessage(
            params.locale,
            'cart.cartLoadFailedDescription',
          ),
        }
      },
    )

    if (cartResult.cart?.items.length) {
      throw redirect({
        href: `/${params.country}/${params.locale}/checkout/${cartResult.cart.id}`,
        replace: true,
      })
    }

    return cartResult
  },
  head: ({ params }) => ({
    meta: buildSeoMeta({
      description: translateMessage(
        params.locale,
        'checkout.checkoutDescription',
      ),
      noIndex: true,
      title: translateMessage(params.locale, 'checkout.checkout'),
    }),
  }),
  component: CheckoutIndexPage,
  errorComponent: CheckoutIndexError,
})

function CheckoutIndexPage() {
  const { cart, cartLoadError } = Route.useLoaderData()

  return (
    <CheckoutEntryState
      initialCart={cartLoadError ? undefined : cart}
      initialCartLoadError={cartLoadError}
    />
  )
}

function CheckoutIndexError({ error }: { error: unknown }) {
  const { country, locale } = Route.useParams()

  return (
    <CheckoutRouteErrorState
      checkoutHref={`/${country}/${locale}/checkout`}
      error={error}
    />
  )
}
