import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/observability')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleBrowserErrorReport } =
          await import('@/lib/observability/browser-error-report.server')
        return handleBrowserErrorReport(request)
      },
    },
  },
})
