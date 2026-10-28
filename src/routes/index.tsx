import { createFileRoute, redirect } from '@tanstack/react-router'

import { getMarketPathFromCookieSource } from '@/lib/cookies/market-cookie'
import { getPreferredMarketPath } from '@/lib/market/api/get-preferred-market'

export const Route = createFileRoute('/')({
  loader: async () => {
    if (import.meta.env.SSR) {
      throw redirect({
        href: await getPreferredMarketPath(),
      })
    }

    const preferredPath = getMarketPathFromCookieSource(document.cookie)

    if (preferredPath) {
      throw redirect({
        href: preferredPath,
      })
    }

    throw redirect({
      href: await getPreferredMarketPath(),
    })
  },
})
