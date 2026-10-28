const UNSAFE_ERROR_MESSAGE_PATTERNS = [
  /active[_\s-]?record|activerecord|pg::|postgres|sql(?:ite|server)?|mysql|redis|sidekiq|rack|rails::/i,
  /\b(?:action[_\s-]?controller|faraday|jsonapi|spree)(?:::|\b)/i,
  /api[_\s-]?key|secret[_\s-]?key|publishable[_\s-]?key|expired\s+api|invalid\s+api/i,
  /fingerprint.*already\s+been\s+taken/i,
  /stack level too deep|undefined method|no route to host|connection refused/i,
  /\b(?:sk|pk)_(?:test|live)_[A-Za-z0-9]+\b/i,
]

export function readErrorMessageText(error: unknown): string | null {
  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  return null
}

export function isUnsafeErrorMessage(message: string) {
  return UNSAFE_ERROR_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
}
