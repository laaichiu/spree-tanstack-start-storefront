import { describe, expect, it } from 'vitest'

import { createAppQueryClient } from './query-client'

describe('createAppQueryClient', () => {
  it('keeps server-owned state stale by default and refreshes it on focus', () => {
    const queryClient = createAppQueryClient()
    const defaults = queryClient.getDefaultOptions()

    expect(defaults.queries?.staleTime).toBe(0)
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true)
    expect(defaults.mutations?.throwOnError).toBe(false)
  })
})
