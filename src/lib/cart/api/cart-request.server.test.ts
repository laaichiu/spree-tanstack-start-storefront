import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCustomerAccessToken } from '@/lib/cookies/auth-cookie.server'

import { createCartForCurrentSession } from './cart-request.server'

vi.mock('@/lib/cookies/auth-cookie.server', () => ({
  getCustomerAccessToken: vi.fn(),
}))

describe('createCartForCurrentSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates authenticated carts with the current customer token', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue('customer-token')
    const create = vi.fn().mockResolvedValue({ id: 'cart_123' })

    await createCartForCurrentSession({
      carts: { create },
    } as never)

    expect(create).toHaveBeenCalledWith(undefined, {
      token: 'customer-token',
    })
  })

  it('still supports guest cart creation when no customer is signed in', async () => {
    vi.mocked(getCustomerAccessToken).mockReturnValue(undefined)
    const create = vi.fn().mockResolvedValue({ id: 'cart_123' })

    await createCartForCurrentSession({
      carts: { create },
    } as never)

    expect(create).toHaveBeenCalledWith(undefined, {})
  })
})
