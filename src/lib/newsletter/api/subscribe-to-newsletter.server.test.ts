// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createNewsletterSubscriptionOnServer } from './subscribe-to-newsletter.server'

const server = vi.hoisted(() => ({
  create: vi.fn(),
  getClient: vi.fn(),
  readPublicBuildEnv: vi.fn(),
}))

vi.mock('@tanstack/react-start/server-only', () => ({}))

vi.mock('@/lib/env/public', () => ({
  readPublicBuildEnv: server.readPublicBuildEnv,
}))

vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClient: server.getClient,
}))

beforeEach(() => {
  vi.clearAllMocks()
  server.readPublicBuildEnv.mockReturnValue({
    storefrontUrl: 'https://storefront.example.com',
  })
  server.getClient.mockReturnValue({
    newsletterSubscribers: {
      create: server.create,
    },
  })
  server.create.mockResolvedValue({})
})

describe('newsletter subscription redirect boundary', () => {
  it('normalizes a configured storefront verification URL before sending it to Spree', async () => {
    await createNewsletterSubscriptionOnServer({
      email: 'subscriber@example.com',
      redirectUrl:
        'https://storefront.example.com/US/EN/newsletter/verify?source=email#confirm',
    })

    expect(server.create).toHaveBeenCalledWith({
      email: 'subscriber@example.com',
      redirect_url: 'https://storefront.example.com/us/en/newsletter/verify',
    })
  })

  it('rejects a hostile origin before it reaches the Spree client', async () => {
    expect(() =>
      createNewsletterSubscriptionOnServer({
        email: 'subscriber@example.com',
        redirectUrl: 'https://evil.example.com/us/en/newsletter/verify',
      }),
    ).toThrow('Newsletter redirect URL is invalid.')

    expect(server.create).not.toHaveBeenCalled()
  })

  it('omits the optional redirect when no redirect was supplied', async () => {
    await createNewsletterSubscriptionOnServer({
      email: 'subscriber@example.com',
    })

    expect(server.create).toHaveBeenCalledWith({
      email: 'subscriber@example.com',
    })
  })
})
