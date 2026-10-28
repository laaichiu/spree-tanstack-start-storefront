import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { getGlobalStartContext } from '@tanstack/react-start'
import { routeTree } from './routeTree.gen'

function getCspNonce(context: unknown) {
  if (
    typeof context !== 'object' ||
    context === null ||
    !('cspNonce' in context)
  ) {
    return undefined
  }

  const cspNonce = context.cspNonce

  return typeof cspNonce === 'string' && cspNonce.length > 0
    ? cspNonce
    : undefined
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  })

  const cspNonce = getCspNonce(getGlobalStartContext())

  if (cspNonce) {
    router.options.ssr = {
      ...router.options.ssr,
      nonce: cspNonce,
    }
  }

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
