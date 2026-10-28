import '@tanstack/react-start/server-only'

import { readPublicBuildEnv } from '@/lib/env/public'
import { normalizeNewsletterVerificationRedirectUrl } from '@/lib/newsletter/utils/newsletter-url'
import { getServerSpreeClient } from '@/lib/spree/client.server'

function getConfiguredStorefrontOrigin() {
  return readPublicBuildEnv(
    {
      VITE_STOREFRONT_URL: import.meta.env.VITE_STOREFRONT_URL,
    },
    {
      strictProduction: import.meta.env.PROD,
    },
  ).storefrontUrl
}

export function normalizeServerNewsletterRedirectUrl(redirectUrl?: string) {
  if (!redirectUrl) {
    return undefined
  }

  return normalizeNewsletterVerificationRedirectUrl({
    expectedOrigin: getConfiguredStorefrontOrigin(),
    redirectUrl,
  })
}

export function createNewsletterSubscriptionOnServer({
  email,
  redirectUrl,
}: {
  email: string
  redirectUrl?: string
}) {
  const normalizedRedirectUrl =
    normalizeServerNewsletterRedirectUrl(redirectUrl)

  if (redirectUrl && !normalizedRedirectUrl) {
    throw new Error('Newsletter redirect URL is invalid.')
  }

  return getServerSpreeClient().newsletterSubscribers.create({
    email,
    ...(normalizedRedirectUrl ? { redirect_url: normalizedRedirectUrl } : {}),
  })
}

export function verifyNewsletterSubscriptionOnServer(token: string) {
  return getServerSpreeClient().newsletterSubscribers.verify({ token })
}
