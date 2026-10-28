import '@tanstack/react-start/server-only'

import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/start-server-core/request-response'

const COMPLETED_ORDER_ACCESS_COOKIE = 'spree_storefront_completed_order_access'
const COMPLETED_ORDER_ACCESS_COOKIE_PREFIX = `${COMPLETED_ORDER_ACCESS_COOKIE}_`
const COMPLETED_ORDER_GROUP_COOKIE_PREFIX =
  'spree_storefront_completed_order_group_'
const COMPLETED_ORDER_ACCESS_MAX_AGE = 60 * 15

type CompletedOrderAccessCookie = {
  ids: string[]
  token: string
}

export type CompletedOrderGroupAccess = {
  number: string
  orderIds: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function getOrderAccessCookieName(orderId: string) {
  const normalizedOrderId = orderId.trim()

  if (!/^[A-Za-z0-9_-]+$/.test(normalizedOrderId)) {
    return undefined
  }

  return `${COMPLETED_ORDER_ACCESS_COOKIE_PREFIX}${normalizedOrderId}`
}

function getOrderGroupCookieName(orderGroupId: string) {
  const normalizedOrderGroupId = orderGroupId.trim()

  if (!/^ogrp_[A-Za-z0-9_-]+$/.test(normalizedOrderGroupId)) {
    return undefined
  }

  return `${COMPLETED_ORDER_GROUP_COOKIE_PREFIX}${normalizedOrderGroupId}`
}

function parseCompletedOrderAccessCookie():
  CompletedOrderAccessCookie | undefined {
  const value = getCookie(COMPLETED_ORDER_ACCESS_COOKIE)

  if (!value) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))

    if (!isRecord(parsed)) {
      return undefined
    }

    if (!Array.isArray(parsed.ids)) {
      return undefined
    }

    const ids = parsed.ids
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter(Boolean)
    const token =
      typeof parsed.token === 'string' ? parsed.token.trim() : undefined

    if (ids.length !== parsed.ids.length || !token) {
      return undefined
    }

    return {
      ids,
      token,
    }
  } catch {
    return undefined
  }
}

export function setCompletedOrderAccessCookie({
  expectedCurrentAccessToken,
  orderIds,
  orderToken,
}: {
  /** The request-start access-cookie snapshot; null means no cookie existed. */
  expectedCurrentAccessToken?: string | null
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

  if (expectedCurrentAccessToken !== undefined) {
    const expectedToken = expectedCurrentAccessToken?.trim() || undefined

    if (
      ids.some(
        (orderId) => getCompletedOrderAccessToken(orderId) !== expectedToken,
      )
    ) {
      return
    }
  }

  const legacyAccess = parseCompletedOrderAccessCookie()
  const idsToPersist = Array.from(
    new Set([...(legacyAccess?.ids ?? []), ...ids]),
  )
  const options = getCompletedOrderCookieOptions()
  let persisted = false

  for (const orderId of idsToPersist) {
    const cookieName = getOrderAccessCookieName(orderId)

    if (!cookieName) {
      continue
    }

    const accessToken = ids.includes(orderId) ? token : legacyAccess?.token

    if (accessToken) {
      setCookie(cookieName, encodeURIComponent(accessToken), options)
      persisted = true
    }
  }

  if (persisted) {
    deleteCookie(COMPLETED_ORDER_ACCESS_COOKIE, { path: '/' })
  }
}

export function getCompletedOrderAccessToken(orderId: string) {
  const normalizedOrderId = orderId.trim()
  const cookieName = getOrderAccessCookieName(normalizedOrderId)

  if (cookieName) {
    const value = getCookie(cookieName)

    if (value) {
      try {
        const token = decodeURIComponent(value).trim()

        if (token) {
          return token
        }
      } catch {
        // Fall back to the legacy cookie for the migration window.
      }
    }
  }

  const access = parseCompletedOrderAccessCookie()

  if (!access?.ids.includes(normalizedOrderId)) {
    return undefined
  }

  return access.token
}

export function setCompletedOrderGroupAccessCookie({
  expectedCurrentAccessToken,
  groupId,
  number,
  orderIds,
}: {
  expectedCurrentAccessToken?: string | null
  groupId: string
  number: string
  orderIds: string[]
}) {
  const cookieName = getOrderGroupCookieName(groupId)
  const normalizedNumber = number.trim()
  const normalizedOrderIds = Array.from(
    new Set(
      orderIds
        .map((orderId) => orderId.trim())
        .filter((orderId) => /^or_[A-Za-z0-9_-]+$/.test(orderId)),
    ),
  )

  if (
    !cookieName ||
    !normalizedNumber ||
    normalizedOrderIds.length !== orderIds.length ||
    normalizedOrderIds.length === 0
  ) {
    return
  }

  if (expectedCurrentAccessToken !== undefined) {
    const expectedToken = expectedCurrentAccessToken?.trim() || undefined

    if (getCompletedOrderAccessToken(groupId) !== expectedToken) {
      return
    }
  }

  setCookie(
    cookieName,
    encodeURIComponent(
      JSON.stringify({
        number: normalizedNumber,
        orderIds: normalizedOrderIds,
      }),
    ),
    getCompletedOrderCookieOptions(),
  )
}

export function getCompletedOrderGroupAccess(
  orderGroupId: string,
): CompletedOrderGroupAccess | undefined {
  const cookieName = getOrderGroupCookieName(orderGroupId)
  const value = cookieName ? getCookie(cookieName) : undefined

  if (!value) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))

    if (!isRecord(parsed)) {
      return undefined
    }

    const number = typeof parsed.number === 'string' ? parsed.number.trim() : ''
    const rawOrderIds = Array.isArray(parsed.orderIds) ? parsed.orderIds : []
    const orderIds = rawOrderIds
      .filter((orderId): orderId is string => typeof orderId === 'string')
      .map((orderId) => orderId.trim())

    if (
      !number ||
      orderIds.length === 0 ||
      orderIds.length !== rawOrderIds.length ||
      orderIds.some((orderId) => !/^or_[A-Za-z0-9_-]+$/.test(orderId)) ||
      new Set(orderIds).size !== orderIds.length
    ) {
      return undefined
    }

    return { number, orderIds }
  } catch {
    return undefined
  }
}
