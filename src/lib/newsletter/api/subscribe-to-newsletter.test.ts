import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getServerSpreeClient } from '@/lib/spree/client.server'

import {
  createNewsletterSubscriptionOnServer,
  verifyNewsletterSubscriptionOnServer,
} from './subscribe-to-newsletter.server'

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClient: vi.fn(),
}))

describe('newsletter SDK resource boundary', () => {
  const create = vi.fn()
  const verify = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSpreeClient).mockReturnValue({
      newsletterSubscribers: {
        create,
        verify,
      },
    } as never)
  })

  it('creates subscriptions through the SDK newsletter resource', async () => {
    create.mockResolvedValueOnce({ id: 'subscriber-1' })

    await createNewsletterSubscriptionOnServer({
      email: 'customer@example.com',
      redirectUrl: 'https://store.example/us/en/newsletter/verify',
    })

    expect(create).toHaveBeenCalledWith({
      email: 'customer@example.com',
      redirect_url: 'https://store.example/us/en/newsletter/verify',
    })
  })

  it('verifies subscriptions through the SDK newsletter resource', async () => {
    verify.mockResolvedValueOnce({ id: 'subscriber-1' })

    await verifyNewsletterSubscriptionOnServer('verification-token')

    expect(verify).toHaveBeenCalledWith({ token: 'verification-token' })
  })
})
