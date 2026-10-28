// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResolvedMarket } from '@/lib/core/market'

import { categoryResource } from '../utils/catalog-category-response.test-support'
import { getNavigationCategoriesForMarket } from './get-navigation-categories.server'

const mocks = vi.hoisted(() => ({ getClient: vi.fn(), list: vi.fn() }))
vi.mock('@tanstack/react-start/server-only', () => ({}))
vi.mock('@/lib/spree/client.server', () => ({
  getServerSpreeClientForMarket: mocks.getClient,
}))

const market: ResolvedMarket = {
  country: 'us',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'mkt_us',
  marketName: 'US',
}

function category(overrides: Record<string, unknown> = {}) {
  return categoryResource(overrides)
}

function response(data: unknown[], page = 1, count = data.length) {
  const offset = (page - 1) * 100
  return {
    data,
    meta: {
      page,
      pages: Math.max(1, Math.ceil(count / 100)),
      count,
      limit: 100,
      from: data.length === 0 ? 0 : offset + 1,
      to: data.length === 0 ? 0 : offset + data.length,
    },
  }
}

function firstPage() {
  return [
    category({ id: 'ctg_z' }),
    ...Array.from({ length: 99 }, (_, index) =>
      category({
        id: `ctg_child_${index}`,
        parent_id: 'ctg_z',
        depth: 1,
        is_root: false,
        is_child: true,
      }),
    ),
  ]
}

describe('navigation category Store API loading', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.getClient.mockReturnValue({ categories: { list: mocks.list } })
  })

  it('reads the complete flat tree in native order before limiting roots', async () => {
    mocks.list
      .mockResolvedValueOnce(response(firstPage(), 1, 102))
      .mockResolvedValueOnce(
        response(
          [
            category({
              id: 'ctg_last_child',
              parent_id: 'ctg_z',
              depth: 1,
              is_root: false,
              is_child: true,
            }),
            category({ id: 'ctg_a' }),
          ],
          2,
          102,
        ),
      )
    const result = await getNavigationCategoriesForMarket({ market, limit: 1 })
    expect(mocks.getClient).toHaveBeenCalledWith(market)
    expect(mocks.list.mock.calls.map(([params]) => params)).toEqual(
      [1, 2].map((page) => ({
        page,
        limit: 100,
        sort: 'lft',
      })),
    )
    expect(result.map(({ id }) => id)).toEqual(['ctg_z'])
    expect(result[0]?.children).toHaveLength(100)
    expect(result[0]?.children.at(-1)?.id).toBe('ctg_last_child')
  })

  it.each([
    { data: null, meta: {} },
    { data: [], meta: { pages: '2' } },
    response([], 2),
    response([], 1, 10_001),
    response([category()], 1, 0),
    response([category({ id: 'prod_wrong' })]),
    response([
      category({ children: [category({ parent_id: 'ctg_foreign' })] }),
    ]),
    {
      ...response([category()]),
      meta: { ...response([category()]).meta, limit: 50 },
    },
    {
      ...response([category()]),
      meta: { ...response([category()]).meta, pages: 2 },
    },
    {
      ...response([category()]),
      meta: {
        ...response([category()]).meta,
        count: Number.MAX_SAFE_INTEGER + 1,
      },
    },
    {
      ...response([category()]),
      meta: { ...response([category()]).meta, from: 0 },
    },
    {
      ...response([category()]),
      meta: { ...response([category()]).meta, to: 2 },
    },
    response([category()], 1, 2),
    response([category({ id: 'ctg_self', parent_id: 'ctg_self' })]),
  ])(
    'rejects malformed pagination, identity and hierarchy: %j',
    async (value) => {
      mocks.list.mockResolvedValue(value)
      await expect(
        getNavigationCategoriesForMarket({ market }),
      ).rejects.toThrow()
      expect(mocks.list).toHaveBeenCalledTimes(1)
    },
  )

  it('rejects duplicate identities across pages', async () => {
    const records = firstPage()
    mocks.list
      .mockResolvedValueOnce(response(records, 1, 101))
      .mockResolvedValueOnce(response([records[0]], 2, 101))
    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow()
  })

  it('rejects a changing catalog count instead of returning a partial tree', async () => {
    mocks.list
      .mockResolvedValueOnce(response(firstPage(), 1, 102))
      .mockResolvedValueOnce(response([category({ id: 'ctg_later' })], 2, 101))
    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow()
    expect(mocks.list).toHaveBeenCalledTimes(2)
  })

  it('rejects truncated later pages', async () => {
    mocks.list
      .mockResolvedValueOnce(response(firstPage(), 1, 102))
      .mockResolvedValueOnce(response([category({ id: 'ctg_later' })], 2, 102))
    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow()
  })

  it.each([0, 1])(
    'accepts the empty catalog page convention: %s',
    async (pages) => {
      const empty = response([])
      mocks.list.mockResolvedValue({ ...empty, meta: { ...empty.meta, pages } })
      await expect(
        getNavigationCategoriesForMarket({ market }),
      ).resolves.toEqual([])
      expect(mocks.list).toHaveBeenCalledTimes(1)
    },
  )

  it('accepts roots without expansions or merchandising fields', async () => {
    mocks.list.mockResolvedValue(response([category()]))
    await expect(getNavigationCategoriesForMarket({ market })).resolves.toEqual(
      [expect.objectContaining({ id: 'ctg_category', children: [] })],
    )
  })

  it('does not return already loaded roots when a later request fails', async () => {
    mocks.list
      .mockResolvedValueOnce(response(firstPage(), 1, 101))
      .mockRejectedValueOnce(new Error('unavailable'))
    await expect(getNavigationCategoriesForMarket({ market })).rejects.toThrow(
      'unavailable',
    )
  })
})
