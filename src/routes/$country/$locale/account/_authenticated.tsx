import {
  Outlet,
  createFileRoute,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import { useCallback } from 'react'

import { requireAuthenticatedCustomer } from '@/lib/account/api/auth-guard'
import { AccountSessionProvider } from '@/lib/account/client/account-session-provider'
import { getAccountLoginRedirectHref } from '@/lib/account/utils/account-login-redirect'

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
  const { country, locale } = Route.useParams()
  const location = useLocation({
    select: (currentLocation) => ({
      hash: currentLocation.hash,
      pathname: currentLocation.pathname,
      searchStr:
        'searchStr' in currentLocation &&
        typeof currentLocation.searchStr === 'string'
          ? currentLocation.searchStr
          : '',
    }),
  })
  const router = useRouter()
  const onSessionRequired = useCallback(async () => {
    await router.navigate({
      href: getAccountLoginRedirectHref({ country, locale }, location),
      replace: true,
    })
  }, [country, locale, location, router])

  return (
    <AccountSessionProvider
      customer={customer}
      onSessionRequired={onSessionRequired}
    >
      <Outlet />
    </AccountSessionProvider>
  )
}
