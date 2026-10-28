import { createFileRoute } from '@tanstack/react-router'

import { AccountSectionShell } from '@/components/account/account-section-shell'
import { getCustomerOrderSummaries } from '@/lib/account/api/order.functions'
import { AccountOrdersList } from '@/components/account/account-orders-list'
import { redirectToAccountLogin } from '@/lib/account/api/auth-guard'
import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'
import { translateMessage } from '@/lib/i18n/messages'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/orders/',
)({
  loader: async ({ location, params }) => {
    try {
      const orders = await getCustomerOrderSummaries({
        data: {
          params: {
            limit: 50,
            page: 1,
            sort: '-completed_at',
          },
          market: {
            country: params.country,
            locale: params.locale,
          },
        },
      })

      return {
        loadError: false,
        orders,
      }
    } catch (error) {
      if (isCustomerSessionRequiredError(error)) {
        return redirectToAccountLogin(params, location)
      }

      return {
        loadError: true,
        orders: [],
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
      title: translateMessage(params.locale, 'account.orders'),
    }),
  component: AccountOrdersPage,
})

function AccountOrdersPage() {
  const { loadError, orders } = Route.useLoaderData()

  return (
    <AccountSectionShell activeSection="orders">
      <AccountOrdersList loadError={loadError} orders={orders} />
    </AccountSectionShell>
  )
}
