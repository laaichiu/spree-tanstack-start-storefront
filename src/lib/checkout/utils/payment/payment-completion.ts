export { readSpreeErrorStatus as readCheckoutErrorStatus } from '@/lib/spree/errors'

export function isRecoverableCheckoutCompletionStatus(
  status: number | undefined,
) {
  return status === 403 || status === 422
}

export function isSpreeCompletedOrder(
  resource: { completed_at?: unknown } | null | undefined,
) {
  if (!resource) {
    return false
  }

  const completedAt = resource.completed_at

  return typeof completedAt === 'string'
    ? completedAt.trim().length > 0
    : Boolean(completedAt)
}
