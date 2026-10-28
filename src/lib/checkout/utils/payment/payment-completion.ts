import { readSpreeErrorCode, readSpreeErrorStatus } from '@/lib/spree/errors'

export {
  readSpreeErrorCode as readCheckoutErrorCode,
  readSpreeErrorStatus as readCheckoutErrorStatus,
}

const RECOVERABLE_CHECKOUT_COMPLETION_CONFLICT_CODES = [
  'cart_already_updated',
  'completion_in_progress',
] as const

export function isRecoverableCheckoutCompletionError(error: unknown) {
  const status = readSpreeErrorStatus(error)

  if (status === 403 || status === 422) {
    return true
  }

  const code = readSpreeErrorCode(error)

  return (
    status === 409 &&
    code !== undefined &&
    RECOVERABLE_CHECKOUT_COMPLETION_CONFLICT_CODES.some(
      (candidate) => candidate === code,
    )
  )
}

export function isSpreeCompletedOrder(resource: unknown) {
  if (
    typeof resource !== 'object' ||
    resource === null ||
    Array.isArray(resource)
  ) {
    return false
  }

  const completedAt =
    'completed_at' in resource ? resource.completed_at : undefined

  return typeof completedAt === 'string'
    ? completedAt.trim().length > 0
    : Boolean(completedAt)
}

export function isCompletedCheckoutOrder(
  order: { completedAt?: unknown; currentStep?: unknown } | null | undefined,
) {
  if (!order) {
    return false
  }

  if (order.currentStep === 'complete') {
    return true
  }

  return typeof order.completedAt === 'string'
    ? order.completedAt.trim().length > 0
    : Boolean(order.completedAt)
}
