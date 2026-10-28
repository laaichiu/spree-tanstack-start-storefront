// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { Category as SpreeCategory } from '@spree/sdk'

import { categoryResource } from '../utils/catalog-category-response.test-support'
import { getPreferredProductBreadcrumbCategory } from './product-category-breadcrumb'

function category(overrides: Record<string, unknown> = {}) {
  return categoryResource(overrides) as SpreeCategory
}

describe('catalog product breadcrumb category selection', () => {
  it('selects the deepest category by parent ownership instead of root flags', () => {
    const preferred = getPreferredProductBreadcrumbCategory([
      category({
        depth: 2,
        id: 'ctg_deep',
        is_root: true,
        parent_id: 'ctg_shallow',
      }),
      category({
        depth: 1,
        id: 'ctg_shallow',
        is_root: false,
        parent_id: 'ctg_root',
      }),
      category({ id: 'ctg_root', parent_id: null }),
    ])

    expect(preferred?.id).toBe('ctg_deep')
  })

  it('keeps the first category when every category is a root', () => {
    const preferred = getPreferredProductBreadcrumbCategory([
      category({ id: 'ctg_first', parent_id: null }),
      category({ id: 'ctg_second', parent_id: null }),
    ])

    expect(preferred?.id).toBe('ctg_first')
  })
})
