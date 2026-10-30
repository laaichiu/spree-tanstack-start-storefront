import { createFileRoute } from '@tanstack/react-router'

import { CheckoutConfirmPaymentPage } from '@/components/checkout/completion/checkout-confirm-payment-page'
import { CheckoutRouteErrorState } from '@/components/checkout/checkout-route-error-state'
import { parseCheckoutPaymentReturnSearch } from '@/lib/checkout/utils/completion/payment-return'
import { useMarket } from '@/components/layout/market-provider'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/confirm-payment/$id')({
  validateSearch: parseCheckoutPaymentReturnSearch,
  head: ({ matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: getMessageFromMatches(
        matches,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: getMessageFromMatches(matches, 'checkout.confirmPayment'),
    }),
  component: ConfirmPaymentRoute,
  errorComponent: ConfirmPaymentError,
})

function ConfirmPaymentRoute() {
  const { country, id: cartId, locale } = Route.useParams()
  const paymentReturn = Route.useSearch()

  return (
    <CheckoutConfirmPaymentPage
      cartId={cartId}
      country={country}
      locale={locale}
      paymentReturn={paymentReturn}
    />
  )
}

function ConfirmPaymentError({ error }: { error: unknown }) {
  const { id } = Route.useParams()
  const { t } = useMarket()

  return (
    <CheckoutRouteErrorState
      checkoutTarget={{ cartId: id }}
      description={t('checkout.confirmPaymentDescription')}
      error={error}
      title={t('checkout.paymentConfirmationFailed')}
    />
  )
}
