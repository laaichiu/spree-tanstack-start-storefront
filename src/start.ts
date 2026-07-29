import { redirect } from '@tanstack/react-router'
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'

import { setPreferredMarketCookies } from '@/lib/cookies/market-cookie.server'
import { getMarketPathFromCookieSource } from '@/lib/cookies/market-cookie'
import { applyStorefrontResponseHeaders } from '@/lib/security/response-headers'
import {
  getDefaultResolvedMarket,
  getMarketPath,
} from '@/lib/market/utils/market'
import {
  normalizeCountry,
  normalizeLocale,
} from '@/lib/market/utils/market-format'

const MARKET_PREFIX = /^\/([a-z]{2})\/([a-z]{2,3}(?:-[a-z0-9]{2,8})?)(?:\/|$)/i

function setMarketPreferenceCookiesFromPath(path: string) {
  const match = path.match(MARKET_PREFIX)

  if (!match) {
    return
  }

  setPreferredMarketCookies({
    country: normalizeCountry(match[1]),
    locale: normalizeLocale(match[2]),
  })
}

function shouldSkipPath(pathname: string) {
  if (pathname.startsWith('/api/')) {
    return true
  }

  if (pathname === '/api') {
    return true
  }

  if (pathname.startsWith('/_')) {
    return true
  }

  if (pathname.startsWith('/.well-known')) {
    return true
  }

  if (
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return true
  }

  return /\.\w+$/.test(pathname)
}

async function getDefaultMarketPath() {
  const { getStorefrontMarketsForRequest } =
    await import('@/lib/market/api/get-storefront-markets.server')
  const market = getDefaultResolvedMarket(
    await getStorefrontMarketsForRequest(),
  )

  setPreferredMarketCookies(market)

  return getMarketPath(market)
}

const marketRoutingMiddleware = createMiddleware().server(
  async ({ next, pathname, request, serverFnMeta }) => {
    if (serverFnMeta || shouldSkipPath(pathname)) {
      return next()
    }

    const existingPrefix = pathname.match(MARKET_PREFIX)

    if (existingPrefix) {
      setPreferredMarketCookies({
        country: normalizeCountry(existingPrefix[1]),
        locale: normalizeLocale(existingPrefix[2]),
      })

      return next()
    }

    const cookiePath = getMarketPathFromCookieSource(
      request.headers.get('cookie') ?? undefined,
    )
    const marketPath = cookiePath ?? (await getDefaultMarketPath())

    if (cookiePath) {
      setMarketPreferenceCookiesFromPath(cookiePath)
    }

    throw redirect({
      href: `${marketPath}${pathname === '/' ? '' : pathname}`,
      statusCode: 307,
    })
  },
)

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

const responseHeadersMiddleware = createMiddleware().server(
  async ({ next, request, serverFnMeta }) => {
    const cspNonce = crypto.randomUUID()
    const result = await next({ context: { cspNonce } })
    const url = new URL(request.url)

    applyStorefrontResponseHeaders(result.response, {
      cspNonce,
      isServerFunction: Boolean(serverFnMeta),
      pathname: url.pathname,
      requestUrl: request.url,
    })

    return result
  },
)

export const startInstance = createStart(() => ({
  requestMiddleware: [
    responseHeadersMiddleware,
    csrfMiddleware,
    marketRoutingMiddleware,
  ],
}))
