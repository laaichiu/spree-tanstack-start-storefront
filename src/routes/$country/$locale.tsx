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
import {
  loadStorefrontShell,
  loadStorefrontShellForResolutionOnServer,
  resolveStorefrontShellOnServer,
} from '@/lib/storefront/api/load-storefront-shell'

export const Route = createFileRoute('/$country/$locale')({
  beforeLoad: async ({ location, params }) => {
    if (!import.meta.env.SSR) {
      return {}
    }

    const shellResolution = await resolveStorefrontShellOnServer({
      country: params.country,
      locale: params.locale,
    })

    if (shellResolution.shouldRedirect) {
      throw redirect({
        href: buildResolvedMarketHref({
          hash: location.hash,
          pathname: location.pathname,
          searchStr:
            'searchStr' in location && typeof location.searchStr === 'string'
              ? location.searchStr
              : '',
          market: shellResolution.market,
        }),
      })
    }

    return { shellResolution }
  },
  loader: async ({ context, location, params }) => {
    const messagesPromise = loadMessages(params.locale)
    const useCheckoutShell = isCheckoutShellPath(location.pathname)
    const shell =
      import.meta.env.SSR && context.shellResolution
        ? await loadStorefrontShellForResolutionOnServer({
            resolution: context.shellResolution,
            useCheckoutShell,
          })
        : await loadStorefrontShell({
            data: {
              country: params.country,
              locale: params.locale,
              useCheckoutShell,
            },
          })

    if (shell.shouldRedirect) {
      throw redirect({
        href: buildResolvedMarketHref({
          hash: location.hash,
          pathname: location.pathname,
          searchStr:
            'searchStr' in location && typeof location.searchStr === 'string'
              ? location.searchStr
              : '',
          market: shell.market,
        }),
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
      branding: shell.branding,
      capabilities: shell.capabilities,
      market,
      marketOptions: shell.marketOptions,
      messages,
    }
  },
  component: MarketRouteLayout,
  notFoundComponent: MarketNotFound,
})

function buildResolvedMarketHref({
  hash,
  market,
  pathname,
  searchStr,
}: {
  hash: string
  market: Parameters<typeof replaceMarketPrefix>[1]
  pathname: string
  searchStr: string
}) {
  return `${replaceMarketPrefix(pathname, market)}${searchStr}${hash}`
}

function MarketRouteLayout() {
  const { branding, capabilities, market, marketOptions, messages } =
    Route.useLoaderData()
  const isCheckoutShell = useRouterState({
    select: (state) =>
      state.matches.some((match) => isCheckoutShellRouteId(match.routeId)),
  })

  return (
    <MarketLayout
      capabilities={capabilities}
      branding={branding}
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
