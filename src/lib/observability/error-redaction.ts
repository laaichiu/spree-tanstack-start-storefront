const STRIPE_KEY_PATTERN =
  /\b(?:sk|pk)_[A-Za-z0-9][A-Za-z0-9_*]*(?:_[A-Za-z0-9_*]+)*/g
const STRIPE_CLIENT_SECRET_PATTERN =
  /\b(?:pi|seti)_[A-Za-z0-9]+_secret_[A-Za-z0-9]+\b/g
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi
const AUTHORIZATION_VALUE_PATTERN =
  /(\bauthorization\b["']?\s*[:=]\s*["']?)([^"',;&}\r\n]+)/gi
const SENSITIVE_FIELD_VALUE_PATTERN =
  /(\b(?:access[_-]?token|api[_-]?key|client[_-]?secret|password|refresh[_-]?token|secret[_-]?key|token)\b["']?\s*[:=]\s*["']?)([^"',;&}\s]+)/gi
const EMAIL_ADDRESS_PATTERN =
  /\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b/gi
const PAYMENT_CARD_NUMBER_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g

export function redactSensitiveText(value: string) {
  return value
    .replace(STRIPE_CLIENT_SECRET_PATTERN, '[redacted]')
    .replace(STRIPE_KEY_PATTERN, (secret) => {
      const environmentPrefix = secret.match(/^(?:sk|pk)_(?:test|live)_/)?.[0]

      return `${environmentPrefix ?? secret.slice(0, 3)}[redacted]`
    })
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [redacted]')
    .replace(AUTHORIZATION_VALUE_PATTERN, '$1[redacted]')
    .replace(SENSITIVE_FIELD_VALUE_PATTERN, '$1[redacted]')
}

export function redactErrorSummaryText(value: string) {
  return redactSensitiveText(value)
    .replace(EMAIL_ADDRESS_PATTERN, '[redacted-email]')
    .replace(PAYMENT_CARD_NUMBER_PATTERN, '[redacted-card]')
}
