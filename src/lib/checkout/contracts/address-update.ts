import type { CheckoutAddressInput } from './address-input'

export type CheckoutAddressSaveSkipReason = 'already_pending' | 'already_saved'

export function getCheckoutAddressSaveSkipReason({
  force = false,
  lastAttemptSignature,
  lastSavedSignature,
  pendingSignature,
  signature,
}: {
  force?: boolean
  lastAttemptSignature?: string | null
  lastSavedSignature?: string | null
  pendingSignature?: string | null
  signature: string
}): CheckoutAddressSaveSkipReason | null {
  if (force) {
    return null
  }

  if (lastSavedSignature && signature === lastSavedSignature) {
    return 'already_saved'
  }

  if (
    (pendingSignature && signature === pendingSignature) ||
    (lastAttemptSignature && signature === lastAttemptSignature)
  ) {
    return 'already_pending'
  }

  return null
}

export function preservePendingCheckoutEmail({
  currentValues,
  nextValues,
}: {
  currentValues: CheckoutAddressInput
  nextValues: CheckoutAddressInput
}): CheckoutAddressInput {
  if (nextValues.email.trim() || !currentValues.email.trim()) {
    return nextValues
  }

  return {
    ...nextValues,
    email: currentValues.email,
  }
}
