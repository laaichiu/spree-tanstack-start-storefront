// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { categoryResource } from '../utils/catalog-category-response.test-support'
import {
  CategoryNavigationResponseError,
  mapSpreeCategoriesToNavigationItems,
} from './category-navigation.mapper'

function category(overrides: Record<string, unknown> = {}) {
  return categoryResource(overrides)
}

describe('catalog category navigation mapping', () => {
  it('retains backend root order before limiting without requiring Custom Fields', () => {
    const roots = ['ctg_z', 'ctg_a', 'ctg_b'].map((id, index) =>
      category({
        id,
        name: `Localized name ${2 - index}`,
        position: 30 - index * 10,
      }),
    )
    expect(
      mapSpreeCategoriesToNavigationItems(roots, 2).map(({ id }) => id),
    ).toEqual(['ctg_z', 'ctg_a'])
    expect(roots.map(({ id }) => id)).toEqual(['ctg_z', 'ctg_a', 'ctg_b'])
  })

  it('returns no replacement categories for an empty response', () => {
    expect(mapSpreeCategoriesToNavigationItems([])).toEqual([])
  })

  it('rebuilds every level from the flat list in backend order', () => {
    const first = category({
      id: 'ctg_z',
      parent_id: 'ctg_root',
    })
    const second = category({
      id: 'ctg_a',
      parent_id: 'ctg_root',
    })
    const grandchild = category({
      id: 'ctg_deep',
      parent_id: 'ctg_z',
    })
    const root = category({
      id: 'ctg_root',
      name: '料理',
      permalink: 'localized-kitchen',
      image_url: 'https://example.com/category.jpg',
    })
    const result = mapSpreeCategoriesToNavigationItems([
      root,
      first,
      grandchild,
      second,
    ])
    expect(result[0]).toMatchObject({
      name: '料理',
      permalink: 'localized-kitchen',
      imageUrl: root.image_url,
    })
    expect(result[0]?.children.map(({ id }) => id)).toEqual(['ctg_z', 'ctg_a'])
    expect(result[0]?.children[0]?.children.map(({ id }) => id)).toEqual([
      'ctg_deep',
    ])
    expect(result[0]).not.toHaveProperty('custom_fields')
  })

  it('preserves backend child order even when serialized positions differ', () => {
    const root = category({ id: 'ctg_root' })
    const children = [20, 10].map((position) =>
      category({ id: `ctg_child_${position}`, parent_id: root.id, position }),
    )
    const navigation = mapSpreeCategoriesToNavigationItems([root, ...children])
    expect(navigation[0]?.children.map(({ id }) => id)).toEqual([
      'ctg_child_20',
      'ctg_child_10',
    ])
  })

  it('rejects duplicate category identities', () => {
    const root = category({ id: 'ctg_root' })
    expect(() => mapSpreeCategoriesToNavigationItems([root, root])).toThrow()
  })

  it('uses canonical flat records and does not consume unrequested child expansions', () => {
    const root = category({ id: 'ctg_root' })
    const child = category({
      id: 'ctg_child',
      parent_id: root.id,
      name: 'Canonical child',
      permalink: 'canonical-child',
    })
    const navigation = mapSpreeCategoriesToNavigationItems([
      {
        ...root,
        children: [{ ...child, name: 'Stale child', permalink: 'stale-child' }],
      },
      child,
    ])
    expect(navigation[0]?.children).toEqual([
      expect.objectContaining({
        name: 'Canonical child',
        permalink: 'canonical-child',
      }),
    ])
  })

  it('does not attach an expanded child when its canonical parent is absent', () => {
    const root = category({ id: 'ctg_root' })
    const child = category({ id: 'ctg_child', parent_id: root.id })
    const navigation = mapSpreeCategoriesToNavigationItems([
      { ...root, children: [child] },
      { ...child, parent_id: 'ctg_foreign' },
    ])
    expect(navigation[0]?.children).toEqual([])
  })

  it.each([
    { records: [category({ id: 'ctg_self', parent_id: 'ctg_self' })] },
    {
      records: [
        category({ id: 'ctg_a', parent_id: 'ctg_b' }),
        category({ id: 'ctg_b', parent_id: 'ctg_a' }),
      ],
    },
  ])(
    'rejects cyclic parent chains even outside the visible roots: %j',
    ({ records }) => {
      expect(() =>
        mapSpreeCategoriesToNavigationItems([category(), ...records], 0),
      ).toThrow(CategoryNavigationResponseError)
    },
  )

  it('builds deep trees without recursive mapping or mutating input', () => {
    const records = Array.from({ length: 2000 }, (_, index) =>
      category({
        id: `ctg_${index}`,
        parent_id: index === 0 ? null : `ctg_${index - 1}`,
        depth: index,
      }),
    )
    const navigation = mapSpreeCategoriesToNavigationItems(
      records.slice().reverse(),
    )
    let level = navigation
    let depth = 0
    while (level.length > 0) {
      depth += 1
      level = level[0]?.children ?? []
    }
    expect(depth).toBe(records.length)
    expect(records.every((record) => !('children' in record))).toBe(true)
  })

  it.each([-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid root limits: %s',
    (limit) => {
      expect(() =>
        mapSpreeCategoriesToNavigationItems([category()], limit),
      ).toThrow()
    },
  )

  it('honors an empty root limit', () => {
    expect(mapSpreeCategoriesToNavigationItems([category()], 0)).toEqual([])
  })

  it('uses parent identity for direct children even when permalinks differ', () => {
    const root = category({
      id: 'ctg_root',
      is_root: true,
      parent_id: null,
      permalink: 'catalog',
    })
    const child = category({
      depth: 1,
      id: 'ctg_child',
      is_child: true,
      is_root: false,
      parent_id: 'ctg_root',
      permalink: 'localized-child',
    })

    const navigation = mapSpreeCategoriesToNavigationItems([root, child])

    expect(navigation[0]?.children.map(({ id }) => id)).toEqual(['ctg_child'])
  })

  it('does not attach a category whose permalink suggests a child but parent disagrees', () => {
    const root = category({
      id: 'ctg_root',
      is_root: true,
      parent_id: null,
      permalink: 'catalog',
    })
    const mixedOwnerCategory = category({
      depth: 1,
      id: 'ctg_foreign',
      is_child: true,
      is_root: false,
      parent_id: 'ctg_other_parent',
      permalink: 'catalog/foreign',
    })

    const navigation = mapSpreeCategoriesToNavigationItems([
      root,
      mixedOwnerCategory,
    ])

    expect(navigation[0]?.children).toEqual([])
  })

  it('does not promote a child when root flags disagree with parent identity', () => {
    const root = category({
      id: 'ctg_root',
      is_root: true,
      parent_id: null,
      permalink: 'catalog',
    })
    const child = category({
      depth: 0,
      id: 'ctg_child',
      is_child: false,
      is_root: true,
      parent_id: 'ctg_root',
      permalink: 'catalog/child',
    })

    const navigation = mapSpreeCategoriesToNavigationItems([root, child])

    expect(navigation).toEqual([
      expect.objectContaining({
        children: [expect.objectContaining({ id: 'ctg_child' })],
        id: 'ctg_root',
      }),
    ])
  })

  it('does not promote a partial child-only response to root navigation', () => {
    const navigation = mapSpreeCategoriesToNavigationItems([
      category({
        depth: 1,
        id: 'ctg_child',
        is_child: true,
        is_root: false,
        parent_id: 'ctg_missing',
        permalink: 'missing/child',
      }),
    ])

    expect(navigation).toEqual([])
  })
})
