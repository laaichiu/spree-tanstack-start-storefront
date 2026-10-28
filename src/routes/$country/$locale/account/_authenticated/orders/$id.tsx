import { createFileRoute } from '@tanstack/react-router'

import { AccountSectionShell } from '@/components/account/account-section-shell'
import { getCustomerOrderDetail } from '@/lib/account/api/order.functions'
import { AccountOrderDetail } from '@/components/account/account-order-detail'
import { getReviewsFeatureEnabledSafely } from '@/lib/reviews/api/product-reviews.functions'
import { redirectToAccountLogin } from '@/lib/account/api/auth-guard'
import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/orders/$id',
)({
  loader: async ({ location, params }) => {
    try {
      const [order, reviewsEnabled] = await Promise.all([
        getCustomerOrderDetail({
          data: {
            market: {
              country: params.country,
              locale: params.locale,
            },
            orderId: params.id,
          },
        }),
        getReviewsFeatureEnabledSafely(),
      ])

      return {
        loadError: false,
        order,
        reviewsEnabled,
      }
    } catch (error) {
      if (isCustomerSessionRequiredError(error)) {
        return redirectToAccountLogin(params, location)
      }

      return {
        loadError: true,
        order: null,
        reviewsEnabled: false,
      }
    }
  },
  head: ({ loaderData, matches, params }) =>
    buildStorefrontSeoHead({
      fallbackDescription: translateMessage(
        params.locale,
        'branding.defaultDescription',
      ),
      locale: params.locale,
      matches,
      noIndex: true,
      title: loaderData?.order?.number
        ? `${translateMessage(params.locale, 'account.order')} ${
            loaderData.order.number
          }`
        : translateMessage(params.locale, 'account.order'),
    }),
  component: AccountOrderDetailPage,
})

function AccountOrderDetailPage() {
  const { id } = Route.useParams()
  const { loadError, order, reviewsEnabled } = Route.useLoaderData()

  return (
    <AccountSectionShell activeSection="orders" showHeader={false}>
      <AccountOrderDetail
        loadError={loadError}
        order={order}
        orderId={id}
        reviewsEnabled={reviewsEnabled}
      />
    </AccountSectionShell>
  )
}
