// @vitest-environment node

import type { Client } from '@spree/sdk'
import { describe, expect, it, vi } from 'vitest'

import { listMarketsWithExpandedCountries } from './list-markets-with-expanded-countries'

describe('market list transport compatibility', () => {
  it('requests expanded countries through the SDK transport', async () => {
    const request = vi.fn().mockResolvedValue({ data: [] })
    const client = { request } as unknown as Client

    await expect(
      listMarketsWithExpandedCountries(client, {
        country: 'US',
        locale: 'en',
      }),
    ).resolves.toEqual({ data: [] })

    expect(request).toHaveBeenCalledWith('GET', '/markets', {
      country: 'US',
      locale: 'en',
      params: { expand: 'countries' },
    })
  })
})
