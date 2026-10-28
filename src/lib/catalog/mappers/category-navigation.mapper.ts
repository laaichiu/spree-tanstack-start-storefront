import type { Category as SpreeCategory } from '@spree/sdk'

import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import { assertCatalogCategoryTreeResourcesAreCategories } from '../utils/catalog-resource-identity'
import { mapSpreeCategoryToSummary } from './category-summary.mapper'

export class CategoryNavigationResponseError extends Error {
  constructor() {
    super('The category navigation response is malformed.')
    this.name = 'CategoryNavigationResponseError'
  }
}

export function mapSpreeCategoriesToNavigationItems(
  categories: SpreeCategory[],
  limit = 7,
): CategoryNavigationItem[] {
  assertCatalogCategoryTreeResourcesAreCategories(categories)
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new CategoryNavigationResponseError()
  }

  const categoriesById = new Map<string, SpreeCategory>()
  const itemsById = new Map<string, CategoryNavigationItem>()
  for (const category of categories) {
    if (categoriesById.has(category.id)) {
      throw new CategoryNavigationResponseError()
    }
    categoriesById.set(category.id, category)
    itemsById.set(category.id, {
      ...mapSpreeCategoryToSummary(category),
      children: [],
    })
  }

  // Validate all parent chains, including records outside the visible roots.
  // Iteration avoids call-stack growth for a deeply nested category tree.
  const completed = new Set<string>()
  for (const category of categories) {
    const ancestors = new Set<string>()
    let current: SpreeCategory | undefined = category
    while (current && !completed.has(current.id)) {
      if (ancestors.has(current.id)) throw new CategoryNavigationResponseError()
      ancestors.add(current.id)
      current =
        current.parent_id === null
          ? undefined
          : categoriesById.get(current.parent_id)
    }
    for (const id of ancestors) completed.add(id)
  }

  const roots: CategoryNavigationItem[] = []
  // The complete Store API list is already in native lft order. Appending in
  // that order preserves every sibling group without sorting or expansions.
  for (const category of categories) {
    const item = itemsById.get(category.id)
    if (!item) throw new CategoryNavigationResponseError()
    if (category.parent_id === null) {
      roots.push(item)
    } else {
      // A missing parent is not a new root (e.g. a filtered legacy category).
      itemsById.get(category.parent_id)?.children.push(item)
    }
  }
  return roots.slice(0, limit)
}
