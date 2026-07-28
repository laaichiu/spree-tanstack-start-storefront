import { createFileRoute } from '@tanstack/react-router'

import { AccountSectionShell } from '@/components/account/account-section-shell'
import { getCustomerOrderSummaries } from '@/lib/account/api/order.functions'
import { AccountOrdersList } from '@/components/account/account-orders-list'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated/orders/',
)({
  loader: async () => {
    try {
      const orders = await getCustomerOrderSummaries({
        data: {
          params: {
            limit: 50,
            page: 1,
            sort: '-completed_at',
          },
        },
      })

      return {
        loadError: false,
        orders,
      }
    } catch {
      return {
        loadError: true,
        orders: [],
      }
    }
  },
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
