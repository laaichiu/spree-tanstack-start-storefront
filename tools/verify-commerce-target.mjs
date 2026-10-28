import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { readCommerceEnvironment } from './commerce-environment.mjs'

export async function verifyCommerceTarget(
  baseURL,
  environment = readCommerceEnvironment(),
) {
  if (environment.E2E_COMMERCE_DISPOSABLE !== 'true')
    throw new Error('Commerce tests require a disposable backend')
  const target = new URL(baseURL)
  const confirmed = new URL(
    environment.E2E_COMMERCE_TARGET_URL || 'https://unconfirmed.invalid',
  )
  if (
    target.origin !== confirmed.origin ||
    target.pathname !== '/' ||
    target.username ||
    target.password ||
    target.search ||
    target.hash ||
    confirmed.toString() !== target.toString()
  ) {
    throw new Error(
      'E2E_COMMERCE_TARGET_URL must exactly confirm the tested storefront origin',
    )
  }
  if (
    target.protocol !== 'https:' &&
    !(
      target.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)
    )
  )
    throw new Error('Remote commerce targets require HTTPS')
  const secret = environment.E2E_COMMERCE_PROBE_KEY
  if (!secret || secret.length < 32)
    throw new Error(
      'E2E_COMMERCE_PROBE_KEY must contain at least 32 characters',
    )
  const apiUrl = new URL(environment.SPREE_API_URL || '')
  const channel = environment.SPREE_CHANNEL?.trim() || 'online'
  const apiKey = environment.SPREE_PUBLISHABLE_KEY?.trim()
  const stripeKey = environment.VITE_STRIPE_PUBLISHABLE_KEY?.trim()
  if (!apiKey?.startsWith('pk_') || !stripeKey?.startsWith('pk_test_'))
    throw new Error(
      'Commerce probes require configured Spree and Stripe test keys',
    )
  const challenge = randomBytes(32).toString('hex')
  const sign = (payload) =>
    createHmac('sha256', secret).update(payload).digest('hex')
  const response = await fetch(new URL('/api/commerce-test-probe', target), {
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
    headers: {
      'x-storefront-test-challenge': challenge,
      'x-storefront-test-proof': sign(`request:${challenge}`),
    },
  })
  if (!response.ok)
    throw new Error(
      'The tested Worker did not enable an authenticated disposable-commerce probe',
    )
  const payload = await response.json()
  const expected = sign(
    JSON.stringify([challenge, apiUrl.toString(), channel, apiKey, stripeKey]),
  )
  if (
    typeof payload?.signature !== 'string' ||
    !/^[a-f0-9]{64}$/.test(payload.signature) ||
    !timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(payload.signature, 'hex'),
    )
  ) {
    throw new Error(
      'The tested Worker backend, Channel, keys, or probe secret differ from the preflight configuration',
    )
  }
}
