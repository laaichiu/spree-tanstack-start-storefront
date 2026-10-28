// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildStorefrontErrorEvent, reportError } from './report-error'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('safe error reporting', () => {
  it('keeps the event bounded and removes credentials and personal data', () => {
    const event = buildStorefrontErrorEvent({
      context: 'checkout.payment',
      error: new Error(
        `reader@example.test pi_example_secret_sensitive ${'x'.repeat(600)}`,
      ),
      routeId: '/checkout/private',
    })
    expect(event.summary.length).toBe(500)
    expect(event.summary).not.toContain('sensitive')
    expect(event.summary).not.toContain('reader@example.test')
    expect(event.routeId).toBeUndefined()
  })

  it.each([false, true])(
    'uses fetch only when the beacon is not queued (%s)',
    (queued) => {
      const beacon = vi.fn().mockReturnValue(queued)
      const fetch = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 204 }))
      vi.stubEnv('DEV', false)
      vi.stubGlobal('navigator', { sendBeacon: beacon })
      vi.stubGlobal('fetch', fetch)
      reportError({
        context: 'reporting.test',
        error: new Error('Test failure'),
      })
      expect(beacon).toHaveBeenCalledOnce()
      if (queued) expect(fetch).not.toHaveBeenCalled()
      else
        expect(fetch).toHaveBeenCalledWith(
          '/api/observability',
          expect.objectContaining({ keepalive: true, method: 'POST' }),
        )
    },
  )
})
