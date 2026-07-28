import { Outlet, createFileRoute } from '@tanstack/react-router'

import { requireAuthenticatedCustomer } from '@/lib/account/api/auth-guard'
import { AccountSessionProvider } from '@/components/account/account-session-provider'

export const Route = createFileRoute(
  '/$country/$locale/account/_authenticated',
)({
  loader: async ({ location, params }) => {
    const customer = await requireAuthenticatedCustomer({
      location,
      params,
    })

    return {
      customer,
    }
  },
  shouldReload: true,
  component: AuthenticatedAccountLayout,
})

function AuthenticatedAccountLayout() {
  const { customer } = Route.useLoaderData()

  return (
    <AccountSessionProvider customer={customer}>
      <Outlet />
    </AccountSessionProvider>
  )
}
