import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'

import { buildSeoMeta, siteSeo } from '@/lib/seo/site-seo'
import { QueryProvider } from '@/lib/query/query-provider'
import { normalizeLocale } from '@/lib/market/utils/market-format'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { translateMessage } from '@/lib/i18n/messages'

import appCss from '../styles/globals.css?url'

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
