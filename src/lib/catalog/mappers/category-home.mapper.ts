import type { Category as SpreeCategory } from '@spree/sdk'

import type { CatalogCategoryReference } from '@/lib/catalog/contracts'
import { mapSpreeCategoryToSummary } from './category-summary.mapper'

function getOrderedCategories(categories: SpreeCategory[]): SpreeCategory[] {
  const orderedCategories: SpreeCategory[] = []
  const seenIds = new Set<string>()

  function appendCategory(category: SpreeCategory) {
    if (seenIds.has(category.id)) {
      return
    }

    seenIds.add(category.id)
    orderedCategories.push(category)
  }

  for (const category of categories) {
    appendCategory(category)
  }

  for (const category of categories) {
    for (const child of category.children ?? []) {
      appendCategory(child)
    }
  }

  return orderedCategories
}

export function mapSpreeCategoriesToHomeSummaries(
  categories: SpreeCategory[],
  limit = 6,
): CatalogCategoryReference[] {
  const orderedCategories = getOrderedCategories(categories)
  const withImages = orderedCategories.filter(
    (category) => category.image_url || category.square_image_url,
  )
  const withoutImages = orderedCategories.filter(
    (category) => !category.image_url && !category.square_image_url,
  )

  return [...withImages, ...withoutImages]
    .slice(0, limit)
    .map(mapSpreeCategoryToSummary)
}
