import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/commerce-test-probe')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleCommerceTestProbe } =
          await import('@/lib/runtime/commerce-test-probe.server')
        return handleCommerceTestProbe(request)
      },
    },
  },
})
