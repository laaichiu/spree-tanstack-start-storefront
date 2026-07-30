import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'

import { buildSeoMeta, siteSeo } from '@/lib/seo/site-seo'
import { QueryProvider } from '@/lib/query/query-provider'
import { normalizeLocale } from '@/lib/market/utils/market-format'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { translateMessage } from '@/lib/i18n/messages'

import appCss from '../styles/globals.css?url'
import interLatinFont from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'

function getMarketParams(params: unknown) {
  if (!params || typeof params !== 'object') {
    return null
  }

  const record = params as Record<string, unknown>

  if (typeof record.country !== 'string' || typeof record.locale !== 'string') {
    return null
  }

  return {
    country: record.country,
    locale: record.locale,
  }
}

export const Route = createRootRoute({
  beforeLoad: ({ context }) => ({
    cspNonce: (context as { serverContext?: { cspNonce?: string } })
      .serverContext?.cspNonce,
  }),
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...buildSeoMeta(siteSeo),
    ],
    links: [
      {
        rel: 'preload',
        href: interLatinFont,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
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
        .find((params) => params !== null)

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
  const additionalContext = router.options.additionalContext as
    | {
        serverContext?: { cspNonce?: string }
      }
    | undefined
  const cspNonce = routeCspNonce ?? additionalContext?.serverContext?.cspNonce

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
    <NotFoundPage
      description={translateMessage('en', 'notFound.description')}
      eyebrow={translateMessage('en', 'notFound.eyebrow')}
      primaryHref="/us/en"
      primaryLabel={translateMessage('en', 'notFound.primaryAction')}
      title={translateMessage('en', 'notFound.title')}
    />
  )
}
