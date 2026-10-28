// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertCatalogCategoryTreeResourceIsCategory,
  assertCatalogProductNestedMediaBelongToProduct,
  assertCatalogProductNestedVariantsBelongToProduct,
  CatalogCategoryAncestorChainMismatchError,
  CatalogDefaultVariantIdMismatchError,
  CatalogMediaProductIdMismatchError,
  CatalogMediaVariantIdMismatchError,
} from './catalog-resource-identity'
import { categoryResource } from './catalog-category-response.test-support'

function product(overrides: Record<string, unknown> = {}) {
  return {
    default_variant_id: 'variant_default',
    id: 'prod_product',
    variants: [
      { id: 'variant_default', product_id: 'prod_product' },
      { id: 'variant_other', product_id: 'prod_product' },
    ],
    ...overrides,
  }
}

describe('catalog product variant ownership', () => {
  it('accepts a default id represented by the expanded variant collection', () => {
    expect(() =>
      assertCatalogProductNestedVariantsBelongToProduct(product()),
    ).not.toThrow()
  })

  it('rejects an expanded default variant with another id', () => {
    expect(() =>
      assertCatalogProductNestedVariantsBelongToProduct(
        product({
          default_variant: {
            id: 'variant_other',
            product_id: 'prod_product',
          },
        }),
      ),
    ).toThrow(CatalogDefaultVariantIdMismatchError)
  })

  it('rejects an explicit null default variant with a non-null id', () => {
    expect(() =>
      assertCatalogProductNestedVariantsBelongToProduct(
        product({ default_variant: null }),
      ),
    ).toThrow(CatalogDefaultVariantIdMismatchError)
  })

  it('rejects an expanded variant collection that omits the declared default', () => {
    expect(() =>
      assertCatalogProductNestedVariantsBelongToProduct(
        product({
          variants: [{ id: 'variant_other', product_id: 'prod_product' }],
        }),
      ),
    ).toThrow(CatalogDefaultVariantIdMismatchError)
  })

  it('leaves an unexpanded default relation available to the response guard', () => {
    expect(() =>
      assertCatalogProductNestedVariantsBelongToProduct({
        default_variant_id: 'variant_default',
        id: 'prod_product',
      }),
    ).not.toThrow()
  })
})

function media(overrides: Record<string, unknown> = {}) {
  return {
    id: 'media_product',
    product_id: 'prod_product',
    variant_ids: ['variant_default'],
    ...overrides,
  }
}

describe('catalog product media ownership', () => {
  it('accepts media assigned to the product and expanded variants', () => {
    expect(() =>
      assertCatalogProductNestedMediaBelongToProduct({
        ...product(),
        media: [media()],
        variants: [
          { ...product().variants[0], primary_media: media() },
          product().variants[1],
        ],
      }),
    ).not.toThrow()
  })

  it('rejects media whose product id belongs to another product', () => {
    expect(() =>
      assertCatalogProductNestedMediaBelongToProduct({
        ...product(),
        media: [media({ product_id: 'prod_other' })],
      }),
    ).toThrow(CatalogMediaProductIdMismatchError)
  })

  it('rejects expanded media that names a variant outside the product', () => {
    expect(() =>
      assertCatalogProductNestedMediaBelongToProduct({
        ...product(),
        media: [media({ variant_ids: ['variant_other_product'] })],
      }),
    ).toThrow(CatalogMediaVariantIdMismatchError)
  })

  it('rejects variant media that is not assigned to its current variant', () => {
    const currentProduct = product()

    expect(() =>
      assertCatalogProductNestedMediaBelongToProduct({
        ...currentProduct,
        variants: [
          {
            ...currentProduct.variants[0],
            primary_media: media({ variant_ids: ['variant_other'] }),
          },
          currentProduct.variants[1],
        ],
      }),
    ).toThrow(CatalogMediaVariantIdMismatchError)
  })

  it('checks media on an expanded default variant without a variants collection', () => {
    expect(() =>
      assertCatalogProductNestedMediaBelongToProduct({
        default_variant: {
          id: 'variant_default',
          primary_media: media({ variant_ids: ['variant_other'] }),
        },
        default_variant_id: 'variant_default',
        id: 'prod_product',
      }),
    ).toThrow(CatalogMediaVariantIdMismatchError)
  })

  it('leaves omitted variant expansion compatible', () => {
    expect(() =>
      assertCatalogProductNestedMediaBelongToProduct({
        default_variant_id: 'variant_default',
        id: 'prod_product',
        media: [media({ variant_ids: ['variant_unexpanded'] })],
      }),
    ).not.toThrow()
  })
})

function category(overrides: Record<string, unknown> = {}) {
  return categoryResource({
    id: 'ctg_category',
    name: 'Category',
    permalink: 'category',
    ...overrides,
  })
}

describe('catalog category ancestor ownership', () => {
  it('accepts an expanded root-to-parent ancestor chain', () => {
    const root = category({
      id: 'ctg_root',
      is_child: false,
      is_leaf: false,
      is_root: true,
      parent_id: null,
      permalink: 'root',
    })
    const parent = category({
      depth: 1,
      id: 'ctg_parent',
      is_child: true,
      is_leaf: false,
      is_root: false,
      parent_id: 'ctg_root',
      permalink: 'root/parent',
    })

    expect(() =>
      assertCatalogCategoryTreeResourceIsCategory(
        category({
          ancestors: [root, parent],
          depth: 2,
          id: 'ctg_child',
          is_child: true,
          is_leaf: true,
          is_root: false,
          parent_id: 'ctg_parent',
          permalink: 'root/parent/child',
        }),
      ),
    ).not.toThrow()
  })

  it('accepts an expanded root with no ancestors', () => {
    expect(() =>
      assertCatalogCategoryTreeResourceIsCategory(
        category({ ancestors: [], parent_id: null }),
      ),
    ).not.toThrow()
  })

  it.each([
    {
      ancestors: [
        category({ id: 'ctg_unrelated', parent_id: null }),
        category({ id: 'ctg_parent', parent_id: 'ctg_unrelated' }),
      ],
      parentId: 'ctg_other',
      label: 'unrelated parent chain',
    },
    {
      ancestors: [
        category({ id: 'ctg_root', parent_id: null }),
        category({ id: 'ctg_parent', parent_id: 'ctg_other' }),
      ],
      parentId: 'ctg_parent',
      label: 'broken ancestor link',
    },
    {
      ancestors: [category({ id: 'ctg_root', parent_id: null })],
      parentId: 'ctg_parent',
      label: 'missing direct parent',
    },
    {
      ancestors: [],
      parentId: 'ctg_parent',
      label: 'missing expanded chain for a child',
    },
  ])('rejects an invalid $label', ({ ancestors, parentId }) => {
    expect(() =>
      assertCatalogCategoryTreeResourceIsCategory(
        category({
          ancestors,
          id: 'ctg_child',
          is_child: true,
          is_leaf: true,
          is_root: false,
          parent_id: parentId,
        }),
      ),
    ).toThrow(CatalogCategoryAncestorChainMismatchError)
  })

  it('rejects a malformed expanded ancestor before checking ownership', () => {
    expect(() =>
      assertCatalogCategoryTreeResourceIsCategory(
        category({
          ancestors: [category({ id: 'ctg_root', name: undefined })],
          parent_id: 'ctg_root',
        }),
      ),
    ).toThrow('catalog category response is malformed')
  })
})
