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
import { translateMessage } from '@/lib/i18n/messages'

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

export const Route = createRootRoute({
  beforeLoad: ({ context }) => ({ cspNonce: getCspNonce(context) }),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
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
        description: translateMessage('en', 'notFound.description'),
        eyebrow: translateMessage('en', 'notFound.eyebrow'),
        primaryLabel: translateMessage('en', 'notFound.primaryAction'),
        title: translateMessage('en', 'notFound.title'),
      }}
    />
  )
}
