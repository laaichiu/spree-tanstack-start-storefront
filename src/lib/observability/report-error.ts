type ReportErrorInput = {
  code?: string
  context: string
  error: unknown
  routeId?: string
  surface?: string
}

export type StorefrontErrorEvent = {
  code?: string
  context: string
  event: 'storefront.error'
  routeId?: string
  summary: string
  surface?: string
}

const MAX_BROWSER_EVENTS = 20
const BROWSER_EVENT_WINDOW_MS = 60_000
let browserEventWindowStartedAt = 0
let browserEventCount = 0

const STRIPE_KEY_PATTERN =
  /\b(?:sk|pk)_[A-Za-z0-9][A-Za-z0-9_*]*(?:_[A-Za-z0-9_*]+)*/g
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi
const AUTHORIZATION_VALUE_PATTERN =
  /(\bauthorization\b["']?\s*[:=]\s*["']?)([^"',;&}\r\n]+)/gi
const SENSITIVE_FIELD_VALUE_PATTERN =
  /(\b(?:access[_-]?token|api[_-]?key|client[_-]?secret|password|refresh[_-]?token|secret[_-]?key|token)\b["']?\s*[:=]\s*["']?)([^"',;&}\s]+)/gi

export function redactSensitiveText(value: string) {
  return value
    .replace(STRIPE_KEY_PATTERN, (secret) => {
      const environmentPrefix = secret.match(/^(?:sk|pk)_(?:test|live)_/)?.[0]

      return `${environmentPrefix ?? secret.slice(0, 3)}[redacted]`
    })
    .replace(BEARER_TOKEN_PATTERN, 'Bearer [redacted]')
    .replace(AUTHORIZATION_VALUE_PATTERN, '$1[redacted]')
    .replace(SENSITIVE_FIELD_VALUE_PATTERN, '$1[redacted]')
}

function readStringProperty(value: object, key: string) {
  try {
    const property = (value as Record<string, unknown>)[key]

    return typeof property === 'string' && property.trim()
      ? property.trim()
      : null
  } catch {
    return null
  }
}

export function getSafeErrorSummary(error: unknown) {
  if (error instanceof Error) {
    const name = error.name.trim() || 'Error'
    const message = error.message.trim()

    return redactSensitiveText(message ? `${name}: ${message}` : name)
  }

  if (typeof error === 'string') {
    return redactSensitiveText(error)
  }

  if (error && typeof error === 'object') {
    const name = readStringProperty(error, 'name')
    const message = readStringProperty(error, 'message')
    const code = readStringProperty(error, 'code')
    const details = [name, message, code ? `code=${code}` : null].filter(
      (value): value is string => Boolean(value),
    )

    return details.length > 0
      ? redactSensitiveText(details.join(': '))
      : 'Non-Error object thrown'
  }

  return `Non-Error value thrown (${typeof error})`
}

function normalizeEventTag(value: string | undefined) {
  const normalized = value?.trim() ?? ''

  return normalized && /^[a-zA-Z0-9._:-]+$/.test(normalized)
    ? normalized.slice(0, 80)
    : undefined
}

export function buildStorefrontErrorEvent({
  code,
  context,
  error,
  routeId,
  surface,
}: ReportErrorInput): StorefrontErrorEvent {
  return {
    ...(normalizeEventTag(code) ? { code: normalizeEventTag(code) } : {}),
    context: normalizeEventTag(context) ?? 'unknown',
    event: 'storefront.error',
    ...(normalizeEventTag(routeId)
      ? { routeId: normalizeEventTag(routeId) }
      : {}),
    summary: getSafeErrorSummary(error).slice(0, 500),
    ...(normalizeEventTag(surface)
      ? { surface: normalizeEventTag(surface) }
      : {}),
  }
}

function canReportBrowserEvent() {
  const now = Date.now()

  if (now - browserEventWindowStartedAt >= BROWSER_EVENT_WINDOW_MS) {
    browserEventWindowStartedAt = now
    browserEventCount = 0
  }

  if (browserEventCount >= MAX_BROWSER_EVENTS) {
    return false
  }

  browserEventCount += 1
  return true
}

function reportBrowserEvent(event: StorefrontErrorEvent) {
  if (!canReportBrowserEvent()) {
    return
  }

  const body = JSON.stringify(event)

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(
        '/api/observability',
        new Blob([body], { type: 'application/json' }),
      )
      return
    }

    void fetch('/api/observability', {
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      method: 'POST',
    }).catch(() => undefined)
  } catch {
    // Reporting must never affect the checkout or navigation request.
  }
}

export function reportError(input: ReportErrorInput) {
  const event = buildStorefrontErrorEvent(input)

  if (typeof window === 'undefined') {
    console.error(JSON.stringify({ ...event, source: 'server' }))
    return
  }

  if (import.meta.env.DEV) {
    console.error(`[${event.context}] ${event.summary}`)
    return
  }

  reportBrowserEvent(event)
}

export function isBrowserFetchFailureError(error: unknown) {
  return (
    typeof window !== 'undefined' &&
    error instanceof TypeError &&
    error.message === 'Failed to fetch'
  )
}
