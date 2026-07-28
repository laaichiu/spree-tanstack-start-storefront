import { createServerFn } from '@tanstack/react-start'

import type { StorefrontShellData } from '../model/storefront-shell'

type LoadStorefrontShellInput = {
  country: string
  locale: string
  useCheckoutShell: boolean
}

export const loadStorefrontShell = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data as LoadStorefrontShellInput)
  .handler(async ({ data }): Promise<StorefrontShellData> => {
    const { serverZod: z } = await import('@/lib/validation/server-zod.server')
    const { marketInputSchema } =
      await import('@/lib/market/utils/market-input')
    const input = z
      .object({
        ...marketInputSchema.shape,
        useCheckoutShell: z.boolean(),
      })
      .parse(data)
    const { loadStorefrontShellForRequest } =
      await import('./load-storefront-shell.server')

    return loadStorefrontShellForRequest(input)
  })
