import { createFileRoute } from '@tanstack/react-router'

import { getCheckoutCart } from '@/lib/checkout/api/checkout-order.functions'
import { getCurrentCustomer } from '@/lib/account/api/customer-session.functions'
import { getCustomerAddresses } from '@/lib/account/api/customer-address.functions'
import { getCustomerCreditCards } from '@/lib/account/api/customer-credit-card.functions'
import { CheckoutEntryState } from '@/components/checkout/checkout-entry-state'
import { CheckoutRouteErrorState } from '@/components/checkout/checkout-route-error-state'
import { CART_MARKET_MISMATCH_MESSAGE } from '@/lib/cart/utils/cart-market'
import { parseCheckoutPaymentErrorSearch } from '@/lib/checkout/utils/completion/checkout-completion-error'
import { translateMessage } from '@/lib/i18n/messages'
import { reportError } from '@/lib/observability/report-error'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/checkout/$id')({
  validateSearch: parseCheckoutPaymentErrorSearch,
  loader: async ({ params }) => {
    try {
      const [cart, customer] = await Promise.all([
        getCheckoutCart({
          data: {
            cartId: params.id,
            market: {
              country: params.country,
              locale: params.locale,
            },
          },
        }),
        getCurrentCustomer().catch(() => null),
      ])
      const [savedAddresses, savedPaymentCards] = customer
        ? await Promise.all([
            getCustomerAddresses({
              data: {
                params: {
                  limit: 50,
                  page: 1,
                },
              },
            }).catch(() => []),
            getCustomerCreditCards({
              data: {
                params: {
                  limit: 50,
                  page: 1,
                },
              },
            }).catch(() => []),
          ])
        : [[], []]

      return {
        cart,
        cartLoadError: null,
        customerEmail: customer?.email ?? null,
        savedAddresses,
        savedPaymentCards,
      }
    } catch (error) {
      reportError({
        context: 'checkout.cart',
        error,
      })

      return {
        cart: null,
        cartLoadError:
          error instanceof Error &&
          error.message === CART_MARKET_MISMATCH_MESSAGE
            ? CART_MARKET_MISMATCH_MESSAGE
            : translateMessage(params.locale, 'cart.cartLoadFailedDescription'),
        customerEmail: null,
        savedAddresses: [],
        savedPaymentCards: [],
      }
    }
  },
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: translateMessage(params.locale, 'checkout.checkout'),
    }),
  component: CheckoutDetailPage,
  errorComponent: CheckoutDetailError,
})

function CheckoutDetailPage() {
  const { id } = Route.useParams()
  const { payment_error: paymentError, payment_error_code: paymentErrorCode } =
    Route.useSearch()
  const {
    cart,
    cartLoadError,
    customerEmail,
    savedAddresses,
    savedPaymentCards,
  } = Route.useLoaderData()

  return (
    <CheckoutEntryState
      cartId={id}
      initialCart={cartLoadError ? undefined : cart}
      initialCartLoadError={cartLoadError}
      initialPaymentError={paymentError}
      initialPaymentErrorCode={paymentErrorCode}
      initialCustomerEmail={customerEmail}
      initialSavedAddresses={savedAddresses}
      initialSavedPaymentCards={savedPaymentCards}
    />
  )
}

function CheckoutDetailError({ error }: { error: unknown }) {
  const { country, id, locale } = Route.useParams()

  return (
    <CheckoutRouteErrorState
      checkoutHref={`/${country}/${locale}/checkout/${id}`}
      error={error}
    />
  )
}
