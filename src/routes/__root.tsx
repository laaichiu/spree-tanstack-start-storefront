import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'

import { QueryProvider } from '@/lib/query/query-provider'
import { normalizeLocale } from '@/lib/core/market'
import { NotFoundPageView } from '@/components/layout/not-found-page-view'
import { fallbackMessages, getMessage } from '@/lib/i18n/messages'
import { getMessageFromMatches } from '@/lib/i18n/message-route-lookup'
import { buildStorefrontSeoHead } from '@/lib/seo/site-seo'

import appCss from '../styles/globals.css?url'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getCspNonce(context: unknown) {
  if (!isRecord(context) || !isRecord(context.serverContext)) {
    return undefined
  }

  const cspNonce = context.serverContext.cspNonce

  return typeof cspNonce === 'string' && cspNonce.length > 0
    ? cspNonce
    : undefined
}

function getMarketParams(params: unknown) {
  if (
    !isRecord(params) ||
    typeof params.country !== 'string' ||
    typeof params.locale !== 'string'
  ) {
    return undefined
  }

  return {
    country: params.country,
    locale: params.locale,
  }
}

function getLocaleFromMatches(matches: readonly { params?: unknown }[]) {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const params = matches[index]?.params

    if (isRecord(params) && typeof params.locale === 'string') {
      return params.locale
    }
  }

  return 'en'
}

function hasMarketNotFoundMatch(
  matches: readonly { routeId: string; status: string }[],
) {
  return matches.some(
    (match) =>
      match.routeId === '/$country/$locale' && match.status === 'notFound',
  )
}

export const Route = createRootRoute({
  beforeLoad: ({ context }) => ({ cspNonce: getCspNonce(context) }),
  head: ({ match, matches }) => {
    const notFoundSeo =
      match._notFound || hasMarketNotFoundMatch(matches)
        ? buildStorefrontSeoHead({
            description: getMessageFromMatches(matches, 'notFound.description'),
            fallbackDescription: getMessageFromMatches(
              matches,
              'notFound.description',
            ),
            locale: getLocaleFromMatches(matches),
            matches,
            noIndex: true,
            title: getMessageFromMatches(matches, 'notFound.title'),
          })
        : null

    return {
      meta: [
        {
          charSet: 'utf-8',
        },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        ...(notFoundSeo?.meta ?? []),
      ],
      links: [
        ...(notFoundSeo?.links ?? []),
        { rel: 'stylesheet', href: appCss },
      ],
      scripts: notFoundSeo?.scripts,
    }
  },
  component: AppRoot,
  notFoundComponent: RootNotFound,
  shellComponent: RootDocument,
})

function AppRoot() {
  return (
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  )
}

function useActiveLocale() {
  return useRouterState({
    select: (state) => {
      const marketParams = state.matches
        .map((item) => getMarketParams(item.params))
        .find((params) => params !== undefined)

      if (!marketParams) {
        return 'en'
      }

      return normalizeLocale(marketParams.locale)
    },
  })
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const locale = useActiveLocale()
  const router = useRouter()
  const { cspNonce: routeCspNonce } = Route.useRouteContext()
  const cspNonce =
    routeCspNonce ?? getCspNonce(router.options.additionalContext)

  if (cspNonce) {
    router.options.ssr = {
      ...router.options.ssr,
      nonce: cspNonce,
    }
  }

  return (
    <html className="scheme-light" lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootNotFound() {
  return (
    <NotFoundPageView
      marketParams={{ country: 'us', locale: 'en' }}
      model={{
        description: getMessage(fallbackMessages, 'notFound.description'),
        eyebrow: getMessage(fallbackMessages, 'notFound.eyebrow'),
        primaryLabel: getMessage(fallbackMessages, 'notFound.primaryAction'),
        title: getMessage(fallbackMessages, 'notFound.title'),
      }}
    />
  )
}
