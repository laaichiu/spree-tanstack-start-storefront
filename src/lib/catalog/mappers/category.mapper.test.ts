import type { Category as SpreeCategory } from '@spree/sdk'
import { describe, expect, it } from 'vitest'

import {
  mapSpreeCategoriesToHomeSummaries,
  mapSpreeCategoriesToNavigationItems,
  mapSpreeCategoryToDetail,
} from './category.mapper'

function category(
  overrides: Partial<SpreeCategory> &
    Pick<SpreeCategory, 'id' | 'name' | 'permalink'>,
): SpreeCategory {
  return {
    children_count: 0,
    depth: 0,
    description: '',
    description_html: '',
    image_url: null,
    is_child: false,
    is_leaf: true,
    is_root: true,
    meta_description: null,
    meta_keywords: null,
    meta_title: null,
    parent_id: null,
    position: 1,
    square_image_url: null,
    ...overrides,
  }
}

describe('mapSpreeCategoriesToHomeSummaries', () => {
  it('prioritizes categories with images and includes child categories', () => {
    const summaries = mapSpreeCategoriesToHomeSummaries(
      [
        category({
          children: [
            category({
              id: 'child-1',
              image_url: 'https://example.com/child.jpg',
              name: 'Child',
              permalink: 'parent/child',
            }),
          ],
          id: 'parent-1',
          name: 'Parent',
          permalink: 'parent',
        }),
        category({
          id: 'category-2',
          image_url: 'https://example.com/category.jpg',
          name: 'Category',
          permalink: 'category',
        }),
      ],
      2,
    )

    expect(summaries).toEqual([
      {
        id: 'category-2',
        imageUrl: 'https://example.com/category.jpg',
        name: 'Category',
        permalink: 'category',
      },
      {
        id: 'child-1',
        imageUrl: 'https://example.com/child.jpg',
        name: 'Child',
        permalink: 'parent/child',
      },
    ])
  })
})

describe('mapSpreeCategoriesToNavigationItems', () => {
  it('keeps root categories with nested children for header navigation', () => {
    const navigationItems = mapSpreeCategoriesToNavigationItems(
      [
        category({
          children: [
            category({
              depth: 1,
              id: 'child-1',
              is_child: true,
              is_root: false,
              name: 'Coffee Machines',
              parent_id: 'parent-1',
              permalink: 'kitchen/coffee-machines',
            }),
          ],
          id: 'parent-1',
          image_url: 'https://example.com/kitchen.jpg',
          name: 'Kitchen',
          permalink: 'kitchen',
        }),
        category({
          depth: 1,
          id: 'child-1',
          is_child: true,
          is_root: false,
          name: 'Coffee Machines',
          parent_id: 'parent-1',
          permalink: 'kitchen/coffee-machines',
        }),
      ],
      7,
    )

    expect(navigationItems).toEqual([
      {
        children: [
          {
            children: [],
            id: 'child-1',
            imageUrl: null,
            name: 'Coffee Machines',
            permalink: 'kitchen/coffee-machines',
          },
        ],
        id: 'parent-1',
        imageUrl: 'https://example.com/kitchen.jpg',
        name: 'Kitchen',
        permalink: 'kitchen',
      },
    ])
  })

  it('reconstructs direct children from flat category permalink paths', () => {
    const navigationItems = mapSpreeCategoriesToNavigationItems(
      [
        category({
          id: 'parent-1',
          name: 'Kitchen',
          permalink: 'kitchen',
        }),
        category({
          depth: 1,
          id: 'child-1',
          is_child: true,
          is_root: false,
          name: 'Coffee Machines',
          parent_id: 'parent-1',
          permalink: 'kitchen/coffee-machines',
        }),
        category({
          depth: 2,
          id: 'grandchild-1',
          is_child: true,
          is_root: false,
          name: 'Automatic Espresso',
          parent_id: 'child-1',
          permalink: 'kitchen/coffee-machines/automatic-espresso',
        }),
      ],
      7,
    )

    expect(navigationItems).toEqual([
      {
        children: [
          {
            children: [
              {
                children: [],
                id: 'grandchild-1',
                imageUrl: null,
                name: 'Automatic Espresso',
                permalink: 'kitchen/coffee-machines/automatic-espresso',
              },
            ],
            id: 'child-1',
            imageUrl: null,
            name: 'Coffee Machines',
            permalink: 'kitchen/coffee-machines',
          },
        ],
        id: 'parent-1',
        imageUrl: null,
        name: 'Kitchen',
        permalink: 'kitchen',
      },
    ])
  })
})

describe('mapSpreeCategoryToDetail', () => {
  it('maps category detail copy and breadcrumbs for collection listing pages', () => {
    const root = category({
      id: 'root-1',
      is_root: true,
      name: 'Categories',
      permalink: 'categories',
    })
    const parent = category({
      depth: 1,
      id: 'parent-1',
      is_child: true,
      is_root: true,
      name: 'Floor Care',
      permalink: 'floor-care',
    })

    const detail = mapSpreeCategoryToDetail(
      category({
        ancestors: [root, parent],
        description_html: '<p>Powerful upright vacuum cleaners.</p>',
        depth: 2,
        id: 'category-1',
        is_child: true,
        is_root: false,
        meta_description: 'Upright vacuum collection.',
        meta_title: 'Upright Vacuums',
        name: 'Upright Vacuums',
        permalink: 'floor-care/upright-vacuums',
      }),
    )

    expect(detail).toEqual({
      breadcrumbs: [
        {
          id: 'parent-1',
          name: 'Floor Care',
          permalink: 'floor-care',
        },
        {
          id: 'category-1',
          name: 'Upright Vacuums',
          permalink: 'floor-care/upright-vacuums',
        },
      ],
      description: 'Powerful upright vacuum cleaners.',
      id: 'category-1',
      imageUrl: null,
      metaDescription: 'Upright vacuum collection.',
      metaTitle: 'Upright Vacuums',
      name: 'Upright Vacuums',
      permalink: 'floor-care/upright-vacuums',
    })
  })
})
