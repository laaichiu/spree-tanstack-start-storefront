import { createServerFn } from '@tanstack/react-start'

import { isSpreeErrorStatus, readSpreeErrorCode } from '@/lib/spree/errors'

const NEWSLETTER_ACCEPTED_MESSAGE =
  'Check your inbox to confirm your subscription.'
const NEWSLETTER_VERIFIED_MESSAGE = 'Newsletter subscription verified.'
const NEWSLETTER_UNSUPPORTED_STATUSES = [404, 405, 501] as const
const NEWSLETTER_INVALID_TOKEN_STATUSES = [422] as const

export type NewsletterSubscribeResult =
  | {
      message: string
      status: 'accepted'
    }
  | {
      status: 'unsupported'
    }

export type NewsletterVerifyResult =
  | {
      message: string
      status: 'verified'
    }
  | {
      status: 'invalid'
    }
  | {
      status: 'unsupported'
    }

function isNewsletterEndpointUnsupported(error: unknown): boolean {
  return isSpreeErrorStatus(error, NEWSLETTER_UNSUPPORTED_STATUSES)
}

function isNewsletterVerificationTokenInvalid(error: unknown): boolean {
  const code = readSpreeErrorCode(error)

  return (
    code === 'invalid_token' ||
    code === 'newsletter_verification_token_invalid' ||
    isSpreeErrorStatus(error, NEWSLETTER_INVALID_TOKEN_STATUSES)
  )
}

export const subscribeToNewsletter = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<NewsletterSubscribeResult> => {
    const { newsletterSubscriptionSchema } =
      await import('../validation/newsletter-subscription')
    const input = newsletterSubscriptionSchema.parse(data)
    try {
      const { createNewsletterSubscriptionOnServer } =
        await import('./subscribe-to-newsletter.server')

      await createNewsletterSubscriptionOnServer({
        email: input.email,
        redirectUrl: input.redirectUrl,
      })

      return {
        message: NEWSLETTER_ACCEPTED_MESSAGE,
        status: 'accepted',
      }
    } catch (error) {
      if (isNewsletterEndpointUnsupported(error)) {
        return {
          status: 'unsupported',
        }
      }

      throw error
    }
  })

export const verifyNewsletterSubscription = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<NewsletterVerifyResult> => {
    const { newsletterVerificationSchema } =
      await import('../validation/newsletter-subscription')
    const input = newsletterVerificationSchema.parse(data)
    try {
      const { verifyNewsletterSubscriptionOnServer } =
        await import('./subscribe-to-newsletter.server')

      await verifyNewsletterSubscriptionOnServer(input.token)

      return {
        message: NEWSLETTER_VERIFIED_MESSAGE,
        status: 'verified',
      }
    } catch (error) {
      if (isNewsletterVerificationTokenInvalid(error)) {
        return {
          status: 'invalid',
        }
      }

      if (isNewsletterEndpointUnsupported(error)) {
        return {
          status: 'unsupported',
        }
      }

      throw error
    }
  })
