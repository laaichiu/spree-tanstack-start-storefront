// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { handleBrowserErrorReport } from './browser-error-report.server'

const event = {
  context: 'checkout.payment',
  event: 'storefront.error',
  summary: 'Payment failed',
}
let clientId = 0
let log: ReturnType<typeof vi.spyOn>

function request(
  body = JSON.stringify(event),
  headers: Record<string, string> = {},
) {
  return new Request('https://shop.example.test/api/observability', {
    method: 'POST',
    headers: { 'cf-connecting-ip': `client-${clientId++}`, ...headers },
    body,
  })
}

beforeEach(() => {
  log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => vi.restoreAllMocks())

describe('browser error reporting boundary', () => {
  it('accepts a canonical event and redacts credentials and customer data before logging', async () => {
    const response = await handleBrowserErrorReport(
      request(
        JSON.stringify({
          ...event,
          summary:
            'Bearer example-token pi_example_secret_value seti_example_secret_value reader@example.test 4242 4242 4242 4242',
        }),
      ),
    )
    expect(response.status).toBe(204)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(log).toHaveBeenCalledOnce()
    expect(JSON.parse(String(log.mock.calls[0][0]))).toEqual({
      ...event,
      source: 'browser',
      summary:
        'Bearer [redacted] [redacted] [redacted] [redacted-email] [redacted-card]',
    })
  })

  it.each<Record<string, string>>([{}, { 'content-length': '1' }])(
    'rejects an oversized body despite missing or understated length: %j',
    async (headers) => {
      const response = await handleBrowserErrorReport(
        request(' '.repeat(8_193), headers),
      )
      expect(response.status).toBe(413)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(log).not.toHaveBeenCalled()
    },
  )

  it('bounds UTF-8 bytes and cancels the stream before consuming the remainder', async () => {
    const cancel = vi.fn()
    const encoded = new TextEncoder().encode('界'.repeat(1_000))
    let chunksRead = 0
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          chunksRead += 1
          controller.enqueue(encoded)
        },
        cancel,
      },
      { highWaterMark: 0 },
    )
    const response = await handleBrowserErrorReport(
      new Request('https://shop.example.test/api/observability', {
        method: 'POST',
        headers: { 'cf-connecting-ip': `client-${clientId++}` },
        body,
        duplex: 'half',
      } as RequestInit),
    )
    expect(response.status).toBe(413)
    expect(chunksRead).toBe(3)
    expect(cancel).toHaveBeenCalledOnce()
    expect(log).not.toHaveBeenCalled()
  })

  it('accepts a bounded chunked body even when a multibyte character spans chunks', async () => {
    const bytes = new TextEncoder().encode(
      JSON.stringify({ ...event, summary: '界' }),
    )
    const splitAt = bytes.indexOf(0xe7) + 1
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, splitAt))
        controller.enqueue(bytes.slice(splitAt))
        controller.close()
      },
    })
    const response = await handleBrowserErrorReport(
      new Request('https://shop.example.test/api/observability', {
        method: 'POST',
        headers: { 'cf-connecting-ip': `client-${clientId++}` },
        body,
        duplex: 'half',
      } as RequestInit),
    )
    expect(response.status).toBe(204)
    expect(JSON.parse(String(log.mock.calls[0][0])).summary).toBe('界')
  })

  it.each([
    'not-json',
    JSON.stringify({ ...event, token: 'forbidden' }),
    JSON.stringify({ ...event, context: '' }),
  ])(
    'rejects malformed reports without logging their payload',
    async (body) => {
      const response = await handleBrowserErrorReport(request(body))
      expect(response.status).toBe(400)
      expect(response.headers.get('Cache-Control')).toBe('no-store')
      expect(log).not.toHaveBeenCalled()
    },
  )

  it('returns an uncached retry response when one client exceeds its reporting budget', async () => {
    const clientKey = `limited-client-${clientId++}`
    for (let index = 0; index < 60; index += 1) {
      expect(
        (
          await handleBrowserErrorReport(
            request(undefined, { 'cf-connecting-ip': clientKey }),
          )
        ).status,
      ).toBe(204)
    }
    const response = await handleBrowserErrorReport(
      request(undefined, { 'cf-connecting-ip': clientKey }),
    )
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(log).toHaveBeenCalledTimes(60)
  })
})
