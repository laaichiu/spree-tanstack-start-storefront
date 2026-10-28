export function readSpreeErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined
  }

  const status = error.status

  return typeof status === 'number' ? status : undefined
}

export function readSpreeErrorCode(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return undefined
  }

  const code = error.code

  return typeof code === 'string' && code.trim() ? code : undefined
}

export function isSpreeErrorStatus(
  error: unknown,
  statuses: readonly number[],
) {
  const status = readSpreeErrorStatus(error)

  return typeof status === 'number' && statuses.includes(status)
}
