// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCustomerAuthCookiesIfCurrentRefreshToken,
  getCustomerAccessToken,
  getCustomerRefreshToken,
  setCustomerAuthCookies,
} from './auth-cookie.server'

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
  server.deleteCookie.mockReset()
  server.getCookie.mockReset()
})

describe('customer auth cookie token boundaries', () => {
  it('trims access and refresh tokens when reading cookies', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_customer_token'
        ? ' access-token '
        : ' refresh-token ',
    )

    expect(getCustomerAccessToken()).toBe('access-token')
    expect(getCustomerRefreshToken()).toBe('refresh-token')
  })

  it('treats whitespace-only auth cookies as absent', () => {
    server.getCookie.mockReturnValue('   ')

    expect(getCustomerAccessToken()).toBeUndefined()
    expect(getCustomerRefreshToken()).toBeUndefined()
  })

  it('trims auth tokens before writing both cookies', () => {
    expect(
      setCustomerAuthCookies({
        refreshToken: ' refresh-token ',
        token: ' access-token ',
      }),
    ).toBe(true)

    expect(server.setCookie).toHaveBeenNthCalledWith(
      1,
      'spree_storefront_customer_token',
      'access-token',
      expect.objectContaining({ httpOnly: true }),
    )
    expect(server.setCookie).toHaveBeenNthCalledWith(
      2,
      'spree_storefront_customer_refresh_token',
      'refresh-token',
      expect.objectContaining({ httpOnly: true }),
    )
  })

  it('does not write a partial auth session when either token is blank', () => {
    expect(
      setCustomerAuthCookies({
        refreshToken: 'refresh-token',
        token: '   ',
      }),
    ).toBe(false)

    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('does not overwrite a newer auth session from a stale refresh response', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_customer_refresh_token'
        ? 'new-refresh-token'
        : undefined,
    )

    expect(
      setCustomerAuthCookies({
        expectedCurrentRefreshToken: 'old-refresh-token',
        refreshToken: 'rotated-refresh-token',
        token: 'rotated-access-token',
      }),
    ).toBe(false)
    expect(server.setCookie).not.toHaveBeenCalled()
  })

  it('writes a refresh response while its refresh-cookie owner is current', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_customer_refresh_token'
        ? 'old-refresh-token'
        : undefined,
    )

    expect(
      setCustomerAuthCookies({
        expectedCurrentRefreshToken: 'old-refresh-token',
        refreshToken: 'rotated-refresh-token',
        token: 'rotated-access-token',
      }),
    ).toBe(true)
    expect(server.setCookie).toHaveBeenCalledTimes(2)
  })

  it('does not clear a newer auth session from a stale logout response', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_customer_refresh_token'
        ? 'new-refresh-token'
        : undefined,
    )

    expect(
      clearCustomerAuthCookiesIfCurrentRefreshToken('old-refresh-token'),
    ).toBe(false)
    expect(server.deleteCookie).not.toHaveBeenCalled()
  })

  it('clears auth cookies while the logout refresh-cookie owner is current', () => {
    server.getCookie.mockImplementation((name: string) =>
      name === 'spree_storefront_customer_refresh_token'
        ? 'refresh-token'
        : undefined,
    )

    expect(clearCustomerAuthCookiesIfCurrentRefreshToken('refresh-token')).toBe(
      true,
    )
    expect(server.deleteCookie).toHaveBeenCalledTimes(2)
  })
})
