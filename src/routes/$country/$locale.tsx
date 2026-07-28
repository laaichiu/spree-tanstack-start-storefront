import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from '@tanstack/react-router'

import { MarketLayout } from '@/components/layout/market-layout'
import { MarketNotFoundPage } from '@/components/layout/market-not-found-page'
import {
  isCheckoutShellPath,
  isCheckoutShellRouteId,
} from '@/lib/checkout/utils/checkout-shell-policy'
import { persistMarketPreference } from '@/lib/market/api/persist-market-preference'
import {
  replaceMarketPrefix,
  resolveMarketSelection,
} from '@/lib/market/utils/market'
import { loadMessages } from '@/lib/i18n/messages'
import { loadStorefrontShell } from '@/lib/storefront/api/load-storefront-shell'

export const Route = createFileRoute('/$country/$locale')({
  loader: async ({ location, params }) => {
    const messagesPromise = loadMessages(params.locale)
    const shell = await loadStorefrontShell({
      data: {
        country: params.country,
        locale: params.locale,
        useCheckoutShell: isCheckoutShellPath(location.pathname),
      },
    })

    if (shell.shouldRedirect) {
      const searchSuffix =
        'searchStr' in location && typeof location.searchStr === 'string'
          ? location.searchStr
          : ''
      const hashSuffix =
        'hash' in location && typeof location.hash === 'string'
          ? location.hash
          : ''

      throw redirect({
        href: `${replaceMarketPrefix(
          location.pathname,
          shell.market,
        )}${searchSuffix}${hashSuffix}`,
      })
    }

    const market = shell.market
    const persistMarketPreferencePromise = import.meta.env.SSR
      ? Promise.resolve()
      : persistMarketPreference({
          data: {
            country: market.country,
            locale: market.locale,
          },
        })
    const [messages] = await Promise.all([
      messagesPromise,
      persistMarketPreferencePromise,
    ])

    return {
      capabilities: shell.capabilities,
      market,
      marketOptions: shell.marketOptions,
      messages,
    }
  },
  component: MarketRouteLayout,
  notFoundComponent: MarketNotFound,
})

function MarketRouteLayout() {
  const { capabilities, market, marketOptions, messages } =
    Route.useLoaderData()
  const isCheckoutShell = useRouterState({
    select: (state) =>
      state.matches.some((match) => isCheckoutShellRouteId(match.routeId)),
  })

  return (
    <MarketLayout
      capabilities={capabilities}
      isCheckout={isCheckoutShell}
      market={market}
      marketOptions={marketOptions}
      messages={messages}
    >
      <Outlet />
    </MarketLayout>
  )
}

function MarketNotFound() {
  const params = Route.useParams()

  return <MarketNotFoundPage market={resolveMarketSelection(params).market} />
}
