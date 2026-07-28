import { createFileRoute, redirect } from '@tanstack/react-router'

import { getPreferredMarketPath } from '@/lib/market/api/get-preferred-market'

export const Route = createFileRoute('/collections/$')({
  loader: async ({ params }) => {
    throw redirect({
      href: `${await getPreferredMarketPath()}/collections/${params._splat}`,
    })
  },
})
