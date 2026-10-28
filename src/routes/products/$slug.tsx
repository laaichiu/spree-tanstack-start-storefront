import { createFileRoute, redirect } from '@tanstack/react-router'

import { getPreferredMarketPath } from '@/lib/market/api/get-preferred-market'

export const Route = createFileRoute('/products/$slug')({
  loader: async ({ params }) => {
    throw redirect({
      href: `${await getPreferredMarketPath()}/products/${params.slug}`,
    })
  },
})
