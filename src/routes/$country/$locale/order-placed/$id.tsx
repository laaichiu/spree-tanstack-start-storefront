import { createFileRoute } from '@tanstack/react-router'

import {
  OrderPlacedError,
  OrderPlacedPage,
} from '@/components/checkout/completion/order-placed-page'
import { getCompletedCheckoutOrder } from '@/lib/checkout/api/checkout-order.functions'
import { translateMessage } from '@/lib/i18n/messages'
import { reportError } from '@/lib/observability/report-error'
import { buildSeoMeta } from '@/lib/seo/site-seo'

export const Route = createFileRoute('/$country/$locale/order-placed/$id')({
  loader: async ({ params }) => {
    try {
      return {
        order: await getCompletedCheckoutOrder({
          data: {
            market: {
              country: params.country,
              locale: params.locale,
            },
            orderId: params.id,
          },
        }),
      }
    } catch (error) {
      reportError({
        context: 'checkout.orderPlaced',
        error,
      })

      return {
        order: null,
      }
    }
  },
  head: ({ loaderData, params }) => ({
    meta: buildSeoMeta({
      description: translateMessage(
        params.locale,
        'checkout.orderPlacedDescription',
      ),
      noIndex: true,
      title: loaderData?.order?.number
        ? `${translateMessage(params.locale, 'account.order')} ${
            loaderData.order.number
          }`
        : translateMessage(params.locale, 'checkout.orderPlaced'),
    }),
  }),
  component: OrderPlacedRoutePage,
  errorComponent: OrderPlacedError,
})

function OrderPlacedRoutePage() {
  const { order } = Route.useLoaderData()

  return <OrderPlacedPage order={order} />
}
