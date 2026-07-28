import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { redactSensitiveText } from '@/lib/observability/report-error'

const browserErrorEventSchema = z
  .object({
    code: z
      .string()
      .max(80)
      .regex(/^[a-zA-Z0-9._:-]+$/)
      .optional(),
    context: z
      .string()
      .max(80)
      .regex(/^[a-zA-Z0-9._:-]+$/),
    event: z.literal('storefront.error'),
    routeId: z
      .string()
      .max(80)
      .regex(/^[a-zA-Z0-9._:-]+$/)
      .optional(),
    summary: z.string().max(500),
    surface: z
      .string()
      .max(80)
      .regex(/^[a-zA-Z0-9._:-]+$/)
      .optional(),
  })
  .strict()

export const Route = createFileRoute('/api/observability')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentLength = Number(request.headers.get('content-length') ?? 0)

        if (contentLength > 8_192) {
          return new Response(null, { status: 413 })
        }

        try {
          const input = browserErrorEventSchema.parse(
            JSON.parse(await request.text()),
          )

          console.error(
            JSON.stringify({
              ...input,
              source: 'browser',
              summary: redactSensitiveText(input.summary),
            }),
          )

          return new Response(null, {
            headers: { 'Cache-Control': 'no-store' },
            status: 204,
          })
        } catch {
          return new Response(null, { status: 400 })
        }
      },
    },
  },
})
