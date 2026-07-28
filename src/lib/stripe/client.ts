import { loadStripe } from '@stripe/stripe-js'

import { readPublicBuildEnv } from '@/lib/env/public'

const stripePublishableKey = readPublicBuildEnv({
  VITE_STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
}).stripePublishableKey

export const isStripeConfigured = Boolean(stripePublishableKey)

export const stripePromise =
  stripePublishableKey && typeof window !== 'undefined'
    ? loadStripe(stripePublishableKey)
    : Promise.resolve(null)
