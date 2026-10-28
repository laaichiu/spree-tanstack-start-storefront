// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCompletedOrderAccessToken,
  getCompletedOrderGroupAccess,
  setCompletedOrderAccessCookie,
  setCompletedOrderGroupAccessCookie,
} from './completed-order-cookie.server'

const server = vi.hoisted(() => ({
  deleteCookie: vi.fn(),
  getCookie: vi.fn(),
  setCookie: vi.fn(),
}))

vi.mock('@tanstack/react-start/server-only', () => ({}))

vi.mock('@tanstack/start-server-core/request-response', () => ({
  deleteCookie: server.deleteCookie,
  getCookie: server.getCookie,
  setCookie: server.setCookie,
}))

beforeEach(() => {
  vi.clearAllMocks()
  server.getCookie.mockReset()
  server.setCookie.mockReset()
  server.deleteCookie.mockReset()
})

describe('completed-order access cookie', () => {
  it('stores each order access token in its own cookie', () => {
    setCompletedOrderAccessCookie({
      orderIds: ['cart_us', 'or_us'],
      orderToken: 'token-us',
    })

    expect(server.setCookie).toHaveBeenCalledTimes(2)
    expect(server.setCookie).toHaveBeenNthCalledWith(
      1,
      'spree_storefront_completed_order_access_cart_us',
      'token-us',
      expect.objectContaining({ httpOnly: true, maxAge: 900 }),
    )
    expect(server.setCookie).toHaveBeenNthCalledWith(
      2,
      'spree_storefront_completed_order_access_or_us',
      'token-us',
      expect.objectContaining({ httpOnly: true, maxAge: 900 }),
    )
    expect(server.deleteCookie).toHaveBeenCalledWith(
      'spree_storefront_completed_order_access',
      { path: '/' },
    )
  })

  it('keeps access tokens isolated when another order completes later', () => {
    const cookies = new Map<string, string>()
    server.setCookie.mockImplementation((name: string, value: string) =>
      cookies.set(name, value),
    )
    server.getCookie.mockImplementation((name: string) => cookies.get(name))

    setCompletedOrderAccessCookie({
      orderIds: ['or_first'],
      orderToken: 'token-first',
    })
    setCompletedOrderAccessCookie({
      orderIds: ['or_second'],
      orderToken: 'token-second',
    })

    expect(getCompletedOrderAccessToken('or_first')).toBe('token-first')
    expect(getCompletedOrderAccessToken('or_second')).toBe('token-second')
  })

  it('does not let a stale response replace a newer token for the same order', () => {
    const cookies = new Map<string, string>()
    server.setCookie.mockImplementation((name: string, value: string) =>
      cookies.set(name, value),
    )
    server.getCookie.mockImplementation((name: string) => cookies.get(name))

    setCompletedOrderAccessCookie({
      expectedCurrentAccessToken: null,
      orderIds: ['cart_order', 'or_order'],
      orderToken: 'new-token',
    })
    setCompletedOrderAccessCookie({
      expectedCurrentAccessToken: null,
      orderIds: ['cart_order', 'or_order'],
      orderToken: 'stale-token',
    })

    expect(getCompletedOrderAccessToken('cart_order')).toBe('new-token')
    expect(getCompletedOrderAccessToken('or_order')).toBe('new-token')
  })

  it('guards only the target order aliases and keeps another order isolated', () => {
    const cookies = new Map<string, string>()
    server.setCookie.mockImplementation((name: string, value: string) =>
      cookies.set(name, value),
    )
    server.getCookie.mockImplementation((name: string) => cookies.get(name))

    setCompletedOrderAccessCookie({
      orderIds: ['or_first'],
      orderToken: 'token-first',
    })
    setCompletedOrderAccessCookie({
      expectedCurrentAccessToken: 'token-first',
      orderIds: ['or_first'],
      orderToken: 'token-first-next',
    })
    setCompletedOrderAccessCookie({
      expectedCurrentAccessToken: null,
      orderIds: ['or_second'],
      orderToken: 'token-second',
    })

    expect(getCompletedOrderAccessToken('or_first')).toBe('token-first-next')
    expect(getCompletedOrderAccessToken('or_second')).toBe('token-second')
  })

  it('reads the legacy shared cookie during migration', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_completed_order_access'
        ? encodeURIComponent(
            JSON.stringify({
              ids: [' or_legacy '],
              token: ' legacy-token ',
            }),
          )
        : undefined,
    )

    expect(getCompletedOrderAccessToken(' or_legacy ')).toBe('legacy-token')
  })

  it('does not create access cookies without a token or safe order id', () => {
    setCompletedOrderAccessCookie({
      orderIds: ['or unsafe'],
      orderToken: 'token',
    })
    setCompletedOrderAccessCookie({
      orderIds: ['or_safe'],
    })

    expect(server.setCookie).not.toHaveBeenCalled()
    expect(server.deleteCookie).not.toHaveBeenCalled()
  })

  it('stores the child-order membership of a completed order group', () => {
    const cookies = new Map<string, string>()
    server.setCookie.mockImplementation((name: string, value: string) =>
      cookies.set(name, value),
    )
    server.getCookie.mockImplementation((name: string) => cookies.get(name))

    setCompletedOrderGroupAccessCookie({
      groupId: 'ogrp_multi_seller',
      number: 'R1001',
      orderIds: ['or_seller_one', 'or_seller_two'],
    })

    expect(getCompletedOrderGroupAccess('ogrp_multi_seller')).toEqual({
      number: 'R1001',
      orderIds: ['or_seller_one', 'or_seller_two'],
    })
  })

  it('rejects malformed or stale order-group membership writes', () => {
    const cookies = new Map<string, string>()
    server.setCookie.mockImplementation((name: string, value: string) =>
      cookies.set(name, value),
    )
    server.getCookie.mockImplementation((name: string) => cookies.get(name))

    setCompletedOrderAccessCookie({
      orderIds: ['ogrp_multi_seller'],
      orderToken: 'new-token',
    })
    setCompletedOrderGroupAccessCookie({
      expectedCurrentAccessToken: null,
      groupId: 'ogrp_multi_seller',
      number: 'R1001',
      orderIds: ['or_seller_one'],
    })
    setCompletedOrderGroupAccessCookie({
      groupId: 'ogrp_multi_seller',
      number: 'R1001',
      orderIds: ['cart_not_an_order'],
    })

    expect(getCompletedOrderGroupAccess('ogrp_multi_seller')).toBeUndefined()
  })
})
