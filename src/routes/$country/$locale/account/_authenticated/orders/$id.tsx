import { createFileRoute } from '@tanstack/react-router'

import { AccountSectionShell } from '@/components/account/account-section-shell'
import { getCustomerOrderDetail } from '@/lib/account/api/order.functions'
import { AccountOrderDetail } from '@/components/account/account-order-detail'
import { getReviewsFeatureStatus } from '@/lib/reviews/api/product-reviews.functions'

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
