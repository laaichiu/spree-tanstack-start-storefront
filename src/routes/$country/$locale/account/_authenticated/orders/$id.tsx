import { createFileRoute } from '@tanstack/react-router'

import { AccountSectionShell } from '@/components/account/account-section-shell'
import { getCustomerOrderDetail } from '@/lib/account/api/order.functions'
import { AccountOrderDetail } from '@/components/account/account-order-detail'
import { getReviewsFeatureStatus } from '@/lib/reviews/api/product-reviews.functions'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/orders/$id',
)({
  loader: async ({ params }) => {
    try {
      const [order, reviewsFeature] = await Promise.all([
        getCustomerOrderDetail({
          data: {
            orderId: params.id,
          },
        }),
        getReviewsFeatureStatus(),
      ])

      return {
        loadError: false,
        order,
        reviewsEnabled: reviewsFeature.enabled,
      }
    } catch {
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
