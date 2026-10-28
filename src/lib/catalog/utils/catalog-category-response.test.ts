// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCatalogCategoryResponse,
  CatalogCategoryResponseTypeMismatchError,
} from './catalog-resource-identity'

const category = {
  children_count: 0,
  depth: 0,
  description: 'Kitchen goods',
  description_html: '<p>Kitchen goods</p>',
  id: 'ctg_kitchen',
  image_url: null,
  is_child: false,
  is_leaf: true,
  is_root: true,
  meta_description: null,
  meta_keywords: null,
  meta_title: null,
  name: 'Kitchen',
  parent_id: null,
  permalink: 'kitchen',
  position: 0,
  square_image_url: null,
}

describe('catalog category response boundary', () => {
  it('accepts the fields used by category mappers', () => {
    expect(() => assertCatalogCategoryResponse(category)).not.toThrow()
  })

  it.each([
    ['name', { name: 123 }],
    ['permalink', { permalink: null }],
    ['position', { position: 'first' }],
    ['depth', { depth: -1 }],
    ['children count', { children_count: 1.5 }],
    ['parent id', { parent_id: 'or_order' }],
    ['description', { description: undefined }],
    ['description html', { description_html: 123 }],
    ['image url', { image_url: false }],
    ['root flag', { is_root: 'yes' }],
  ])('rejects a malformed category %s field', (_field, override) => {
    expect(() =>
      assertCatalogCategoryResponse({ ...category, ...override }),
    ).toThrow(CatalogCategoryResponseTypeMismatchError)
  })

  it('accepts nullable metadata and artwork fields', () => {
    expect(() =>
      assertCatalogCategoryResponse({
        ...category,
        image_url: 'https://example.com/category.jpg',
        meta_description: 'Kitchen collection',
        meta_keywords: 'kitchen,home',
        meta_title: 'Kitchen',
        parent_id: 'ctg_home',
        square_image_url: 'https://example.com/category-square.jpg',
      }),
    ).not.toThrow()
  })
})
