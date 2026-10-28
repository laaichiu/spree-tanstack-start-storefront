import { createServerFn, createServerOnlyFn } from '@tanstack/react-start'

import type {
  StorefrontShellData,
  StorefrontShellResolution,
} from '@/lib/storefront/contracts'
import type { MarketSelectionInput } from '@/lib/core/market'

export const loadStorefrontShell = createServerFn({ method: 'GET' })
  .validator((data: unknown) => data)
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

export const resolveStorefrontShellOnServer = createServerOnlyFn(
  async (input: MarketSelectionInput) => {
    const { resolveStorefrontShellForRequest } =
      await import('./load-storefront-shell.server')

    return resolveStorefrontShellForRequest(input)
  },
)

export const loadStorefrontShellForResolutionOnServer = createServerOnlyFn(
  async ({
    resolution,
    useCheckoutShell,
  }: {
    resolution: StorefrontShellResolution
    useCheckoutShell: boolean
  }) => {
    const { loadStorefrontShellForResolution } =
      await import('./load-storefront-shell.server')

    return loadStorefrontShellForResolution({ resolution, useCheckoutShell })
  },
)
