import '@tanstack/react-start/server-only'

import { getServerSpreeClient } from '@/lib/spree/client.server'

export function createNewsletterSubscriptionOnServer({
  email,
  redirectUrl,
}: {
  email: string
  redirectUrl?: string
}) {
  return getServerSpreeClient().newsletterSubscribers.create({
    email,
    ...(redirectUrl ? { redirect_url: redirectUrl } : {}),
  })
}

export function verifyNewsletterSubscriptionOnServer(token: string) {
  return getServerSpreeClient().newsletterSubscribers.verify({ token })
}
