import '@tanstack/react-start/server-only'
import { z } from 'zod'

import { redactErrorSummaryText } from './error-redaction'
import { createSlidingWindowRateLimiter } from './observability-rate-limit'

const MAX_BODY_BYTES = 8_192
const browserErrorRateLimiter = createSlidingWindowRateLimiter({
  limit: 60,
  maxKeys: 1_024,
  windowMs: 60_000,
})
const eventTag = z
  .string()
  .max(80)
  .regex(/^[a-zA-Z0-9._:-]+$/)
const browserErrorEventSchema = z
  .object({
    code: eventTag.optional(),
    context: eventTag,
    event: z.literal('storefront.error'),
    routeId: eventTag.optional(),
    summary: z.string().max(500),
    surface: eventTag.optional(),
  })
  .strict()

function respond(status: number) {
  return new Response(null, {
    headers: {
      'Cache-Control': 'no-store',
      ...(status === 429 ? { 'Retry-After': '60' } : {}),
    },
    status,
  })
}

async function readBoundedBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return ''

  const decoder = new TextDecoder()
  let byteCount = 0
  let text = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return text + decoder.decode()

      byteCount += value.byteLength
      if (byteCount > MAX_BODY_BYTES) {
        // Cancel without waiting for the producer to finish sending the body.
        void reader.cancel().catch(() => undefined)
        return null
      }
      text += decoder.decode(value, { stream: true })
    }
  } finally {
    reader.releaseLock()
  }
}

export async function handleBrowserErrorReport(request: Request) {
  const clientKey =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0] ??
    'anonymous'

  if (!browserErrorRateLimiter(clientKey)) return respond(429)

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) return respond(413)

  try {
    const body = await readBoundedBody(request)
    if (body === null) return respond(413)

    const input = browserErrorEventSchema.parse(JSON.parse(body))
    console.error(
      JSON.stringify({
        ...input,
        source: 'browser',
        summary: redactErrorSummaryText(input.summary),
      }),
    )
    return respond(204)
  } catch {
    return respond(400)
  }
}
