import '@tanstack/react-start/server-only'

import {
  getCookie,
  setCookie,
} from '@tanstack/start-server-core/request-response'

const COMPLETED_ORDER_ACCESS_COOKIE = 'spree_storefront_completed_order_access'
const COMPLETED_ORDER_ACCESS_MAX_AGE = 60 * 15

type CompletedOrderAccessCookie = {
  ids: string[]
  token: string
}

function getCompletedOrderCookieOptions() {
  return {
    httpOnly: true,
    maxAge: COMPLETED_ORDER_ACCESS_MAX_AGE,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

function parseCompletedOrderAccessCookie():
  | CompletedOrderAccessCookie
  | undefined {
  const value = getCookie(COMPLETED_ORDER_ACCESS_COOKIE)

  if (!value) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))

    if (!parsed || typeof parsed !== 'object') {
      return undefined
    }

    const candidate = parsed as {
      ids?: unknown
      token?: unknown
    }

    if (
      !Array.isArray(candidate.ids) ||
      !candidate.ids.every((id) => typeof id === 'string' && id.trim()) ||
      typeof candidate.token !== 'string' ||
      !candidate.token.trim()
    ) {
      return undefined
    }

    return {
      ids: candidate.ids,
      token: candidate.token,
    }
  } catch {
    return undefined
  }
}

export function setCompletedOrderAccessCookie({
  orderIds,
  orderToken,
}: {
  orderIds: string[]
  orderToken?: string
}) {
  const token = orderToken?.trim()

  if (!token) {
    return
  }

  const ids = Array.from(
    new Set(orderIds.map((orderId) => orderId.trim()).filter(Boolean)),
  )

  if (ids.length === 0) {
    return
  }

  setCookie(
    COMPLETED_ORDER_ACCESS_COOKIE,
    encodeURIComponent(
      JSON.stringify({
        ids,
        token,
      } satisfies CompletedOrderAccessCookie),
    ),
    getCompletedOrderCookieOptions(),
  )
}

export function getCompletedOrderAccessToken(orderId: string) {
  const access = parseCompletedOrderAccessCookie()

  if (!access?.ids.includes(orderId)) {
    return undefined
  }

  return access.token
}
