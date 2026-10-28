import { createFileRoute, redirect } from '@tanstack/react-router'

import { getPreferredMarketPath } from '@/lib/market/api/get-preferred-market'

export const Route = createFileRoute('/checkout/')({
  loader: async () => {
    throw redirect({
      href: `${await getPreferredMarketPath()}/checkout`,
    })
  },
})
