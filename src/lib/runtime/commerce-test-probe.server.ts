import '@tanstack/react-start/server-only'

import { readServerEnv } from '@/lib/env/env.server'

// Enabled only on disposable commerce environments. Never return configuration
// or credentials: a nonce-bound HMAC proves that the Worker uses the expected tuple.
export async function handleCommerceTestProbe(
  request: Request,
  environment: Record<string, string | undefined> = process.env,
  stripeKey: string = String(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
) {
  const unavailable = () =>
    new Response(null, {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    })
  const secret = environment.E2E_COMMERCE_PROBE_KEY
  if (
    environment.E2E_COMMERCE_DISPOSABLE !== 'true' ||
    !secret ||
    secret.length < 32 ||
    !stripeKey.startsWith('pk_test_')
  )
    return unavailable()
  const challenge = request.headers.get('x-storefront-test-challenge') ?? ''
  const proof = request.headers.get('x-storefront-test-proof') ?? ''
  if (!/^[a-f0-9]{64}$/.test(challenge) || !/^[a-f0-9]{64}$/.test(proof))
    return unavailable()
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify', 'sign'],
  )
  const proofBytes = Uint8Array.from(proof.match(/../g) ?? [], (value) =>
    Number.parseInt(value, 16),
  )
  if (
    !(await crypto.subtle.verify(
      'HMAC',
      key,
      proofBytes,
      encoder.encode(`request:${challenge}`),
    ))
  )
    return unavailable()
  const env = readServerEnv(environment)
  const payload = JSON.stringify([
    challenge,
    new URL(env.spreeApiUrl).toString(),
    env.spreeChannel,
    env.spreePublishableKey,
    stripeKey,
  ])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const signature = Array.from(new Uint8Array(signed), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('')
  return Response.json(
    { signature },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
