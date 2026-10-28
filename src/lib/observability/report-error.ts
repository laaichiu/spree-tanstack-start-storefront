import { redactErrorSummaryText } from './error-redaction'

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

function readStringProperty(value: object, key: string) {
  try {
    const property = Reflect.get(value, key)

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

    return redactErrorSummaryText(message ? `${name}: ${message}` : name)
  }

  if (typeof error === 'string') {
    return redactErrorSummaryText(error)
  }

  if (error && typeof error === 'object') {
    const name = readStringProperty(error, 'name')
    const message = readStringProperty(error, 'message')
    const code = readStringProperty(error, 'code')
    const details = [name, message, code ? `code=${code}` : null].filter(
      (value): value is string => Boolean(value),
    )

    return details.length > 0
      ? redactErrorSummaryText(details.join(': '))
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
  const normalizedCode = normalizeEventTag(code)
  const normalizedContext = normalizeEventTag(context)
  const normalizedRouteId = normalizeEventTag(routeId)
  const normalizedSurface = normalizeEventTag(surface)

  return {
    ...(normalizedCode ? { code: normalizedCode } : {}),
    context: normalizedContext ?? 'unknown',
    event: 'storefront.error',
    ...(normalizedRouteId ? { routeId: normalizedRouteId } : {}),
    summary: getSafeErrorSummary(error).slice(0, 500),
    ...(normalizedSurface ? { surface: normalizedSurface } : {}),
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
      const queued = navigator.sendBeacon(
        '/api/observability',
        new Blob([body], { type: 'application/json' }),
      )
      if (queued) return
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
