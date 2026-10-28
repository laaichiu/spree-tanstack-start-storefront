export type CheckoutPaymentSessionInitializationDecision =
  | {
      type: 'reset'
      reason: 'not_required' | 'unsupported_gateway' | 'stripe_not_configured'
    }
  | { type: 'skip' }
  | { type: 'initialize' }

export function getCheckoutPaymentSessionInitializationDecision({
  gatewayId,
  lastPaymentSessionKey,
  selectedSessionKey,
  sessionRequired,
  stripeConfigured,
}: {
  gatewayId: string
  lastPaymentSessionKey: string | null
  selectedSessionKey: string
  sessionRequired: boolean
  stripeConfigured: boolean
}): CheckoutPaymentSessionInitializationDecision {
  if (!sessionRequired) {
    return { reason: 'not_required', type: 'reset' }
  }

  if (gatewayId !== 'stripe') {
    return { reason: 'unsupported_gateway', type: 'reset' }
  }

  if (!stripeConfigured) {
    return { reason: 'stripe_not_configured', type: 'reset' }
  }

  return {
    type: lastPaymentSessionKey === selectedSessionKey ? 'skip' : 'initialize',
  }
}
