import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearCustomerAuthCookies,
  getCustomerAccessToken,
  getCustomerRefreshToken,
  setCustomerAuthCookies,
} from '@/lib/cookies/auth-cookie.server'
import { getServerSpreeClient } from '@/lib/spree/client.server'

import {
  CustomerSessionRequiredError,
  withCustomerSession,
} from './customer-session.server'

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  clearCustomerAuthCookies: vi.fn(),
  getCustomerAccessToken: vi.fn(),
  getCustomerRefreshToken: vi.fn(),
  setCustomerAuthCookies: vi.fn(),
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClient: vi.fn(),
}))

function spreeError(status: number) {
  return Object.assign(new Error(`Spree request failed with ${status}.`), {
    status,
  })
}

function setSpreeClient() {
  const refresh = vi.fn()

  vi.mocked(getServerSpreeClient).mockReturnValue({
    auth: {
      refresh,
    },
  } as never)

  return {
    refresh,
  }
}

describe('withCustomerSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCustomerAccessToken).mockReturnValue('access-token')
    vi.mocked(getCustomerRefreshToken).mockReturnValue('refresh-token')
  })

  it('refreshes when only a refresh token remains', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
    })
    const action = vi.fn(async ({ token }: { token: string }) => token)

    await expect(withCustomerSession(action)).resolves.toBe('next-access-token')
    expect(refresh).toHaveBeenCalledWith({
      refresh_token: 'refresh-token',
    })
    expect(setCustomerAuthCookies).toHaveBeenCalledWith({
      refreshToken: 'next-refresh-token',
      token: 'next-access-token',
    })
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('refreshes and retries once after an unauthorized response', async () => {
    const { refresh } = setSpreeClient()
    refresh.mockResolvedValue({
      refresh_token: 'next-refresh-token',
      token: 'next-access-token',
    })
    const action = vi
      .fn()
      .mockRejectedValueOnce(spreeError(401))
      .mockResolvedValueOnce('customer')

    await expect(withCustomerSession(action)).resolves.toBe('customer')
    expect(action).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ token: 'access-token' }),
    )
    expect(action).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ token: 'next-access-token' }),
    )
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('does not clear the session for non-authentication failures', async () => {
    const { refresh } = setSpreeClient()
    const error = spreeError(500)

    await expect(
      withCustomerSession(async () => {
        throw error
      }),
    ).rejects.toBe(error)
    expect(refresh).not.toHaveBeenCalled()
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('clears invalid refresh credentials and reports a missing session', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockRejectedValue(spreeError(401))

    await expect(
      withCustomerSession(async () => 'customer'),
    ).rejects.toBeInstanceOf(CustomerSessionRequiredError)
    expect(clearCustomerAuthCookies).toHaveBeenCalledTimes(1)
  })

  it('preserves the session when the initial refresh fails transiently', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    const error = spreeError(500)
    refresh.mockRejectedValue(error)

    await expect(withCustomerSession(async () => 'customer')).rejects.toBe(
      error,
    )
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('preserves the session when a retry refresh fails transiently', async () => {
    const { refresh } = setSpreeClient()
    const refreshError = spreeError(503)
    refresh.mockRejectedValue(refreshError)

    await expect(
      withCustomerSession(async () => {
        throw spreeError(401)
      }),
    ).rejects.toBe(refreshError)
    expect(clearCustomerAuthCookies).not.toHaveBeenCalled()
  })

  it('coalesces concurrent refreshes that share a rotated token', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const { refresh } = setSpreeClient()
    refresh.mockImplementation(async () => {
      await Promise.resolve()

      return {
        refresh_token: 'next-refresh-token',
        token: 'next-access-token',
      }
    })
    const firstAction = vi.fn(async ({ token }: { token: string }) => token)
    const secondAction = vi.fn(async ({ token }: { token: string }) => token)

    await expect(
      Promise.all([
        withCustomerSession(firstAction),
        withCustomerSession(secondAction),
      ]),
    ).resolves.toEqual(['next-access-token', 'next-access-token'])
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(setCustomerAuthCookies).toHaveBeenCalledTimes(1)
    expect(firstAction).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'next-access-token' }),
    )
    expect(secondAction).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'next-access-token' }),
    )
  })
})
