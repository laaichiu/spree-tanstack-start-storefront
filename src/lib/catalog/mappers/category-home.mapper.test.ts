// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { categoryResource } from '../utils/catalog-category-response.test-support'
import { mapSpreeCategoriesToHomeSummaries } from './category-home.mapper'

function category(overrides: Record<string, unknown> = {}) {
  return categoryResource(overrides)
}

describe('catalog home category mapping', () => {
  it('deduplicates the same category by identity across flat and expanded data', () => {
    const categoryId = 'ctg_shared'
    const categories = [
      category({
        id: categoryId,
        image_url: '/flat.jpg',
        permalink: 'flat-path',
      }),
      category({
        children: [
          category({
            id: categoryId,
            image_url: '/expanded.jpg',
            permalink: 'expanded-path',
          }),
        ],
        id: 'ctg_parent',
      }),
    ]

    expect(mapSpreeCategoriesToHomeSummaries(categories)).toEqual([
      expect.objectContaining({
        id: categoryId,
        imageUrl: '/flat.jpg',
        permalink: 'flat-path',
      }),
      expect.objectContaining({ id: 'ctg_parent' }),
    ])
  })

  it('keeps distinct categories even when their permalinks are equal', () => {
    const summaries = mapSpreeCategoriesToHomeSummaries([
      category({ id: 'ctg_first', permalink: 'shared-path' }),
      category({ id: 'ctg_second', permalink: 'shared-path' }),
    ])

    expect(summaries.map(({ id }) => id)).toEqual(['ctg_first', 'ctg_second'])
  })
})
