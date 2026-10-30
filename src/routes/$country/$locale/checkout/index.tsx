import { createFileRoute, redirect } from '@tanstack/react-router'

import { getCart } from '@/lib/cart/api/cart-read.functions'
import { CheckoutEntryState } from '@/components/checkout/checkout-entry-state'
import { CheckoutRouteErrorState } from '@/components/checkout/checkout-route-error-state'
import { fallbackMessages, getMessage, loadMessages } from '@/lib/i18n/messages'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { reportError } from '@/lib/observability/report-error'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

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
      async (error: unknown) => {
        reportError({
          context: 'checkout.cart',
          error,
        })
        const messages = await loadMessages(params.locale).catch(
          () => fallbackMessages,
        )

        return {
          cart: null,
          cartLoadError: getMessage(messages, 'cart.cartLoadFailedDescription'),
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
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: getMessageFromMatches(
        matches,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: getMessageFromMatches(matches, 'checkout.checkout'),
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
  return <CheckoutRouteErrorState checkoutTarget={{}} error={error} />
}
