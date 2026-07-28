import type { Category as SpreeCategory } from '@spree/sdk'

import type {
  CategoryBreadcrumbItem,
  CategoryDetail,
  CategoryNavigationItem,
  CategorySummary,
} from '../model/category'

export function mapSpreeCategoryToSummary(
  category: SpreeCategory,
): CategorySummary {
  return {
    id: category.id,
    imageUrl: category.image_url ?? category.square_image_url,
    name: category.name,
    permalink: category.permalink,
  }
}

export function mapSpreeCategoryToNavigationItem(
  category: SpreeCategory,
): CategoryNavigationItem {
  return {
    ...mapSpreeCategoryToSummary(category),
    children: (category.children ?? []).map(mapSpreeCategoryToNavigationItem),
  }
}

function stripHtmlTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function mapCategoryBreadcrumb(
  category: SpreeCategory,
): CategoryBreadcrumbItem {
  return {
    id: category.id,
    name: category.name,
    permalink: category.permalink,
  }
}

export function isSyntheticCatalogRootCategory(category: SpreeCategory) {
  return (
    category.permalink.toLowerCase() === 'categories' ||
    category.name.trim().toLowerCase() === 'categories'
  )
}

export function mapSpreeCategoryToDetail(
  category: SpreeCategory,
): CategoryDetail {
  const description =
    stripHtmlTags(category.description) ||
    stripHtmlTags(category.description_html) ||
    category.meta_description ||
    ''

  return {
    ...mapSpreeCategoryToSummary(category),
    breadcrumbs: [
      ...(category.ancestors ?? [])
        .filter((ancestor) => !isSyntheticCatalogRootCategory(ancestor))
        .map(mapCategoryBreadcrumb),
      mapCategoryBreadcrumb(category),
    ],
    description,
    metaDescription: category.meta_description,
    metaTitle: category.meta_title,
  }
}

function getDirectFlatChildren(
  category: SpreeCategory,
  categories: SpreeCategory[],
) {
  return categories.filter((candidate) => {
    if (candidate.id === category.id) {
      return false
    }

    if (candidate.parent_id === category.id) {
      return true
    }

    if (!candidate.permalink.startsWith(`${category.permalink}/`)) {
      return false
    }

    const remainingPath = candidate.permalink.slice(
      category.permalink.length + 1,
    )

    return remainingPath.length > 0 && !remainingPath.includes('/')
  })
}

function mapSpreeCategoryToNavigationItemFromList(
  category: SpreeCategory,
  categories: SpreeCategory[],
  seenIds = new Set<string>(),
): CategoryNavigationItem {
  if (seenIds.has(category.id)) {
    return {
      ...mapSpreeCategoryToSummary(category),
      children: [],
    }
  }

  seenIds.add(category.id)

  const nestedChildren =
    category.children && category.children.length > 0
      ? category.children
      : getDirectFlatChildren(category, categories)

  return {
    ...mapSpreeCategoryToSummary(category),
    children: nestedChildren.map((child) =>
      mapSpreeCategoryToNavigationItemFromList(child, categories, seenIds),
    ),
  }
}

function getRootCategories(categories: SpreeCategory[]): SpreeCategory[] {
  const rootCategories = categories.filter(
    (category) =>
      category.parent_id === null || category.depth === 0 || category.is_root,
  )

  return rootCategories.length > 0 ? rootCategories : categories
}

export function mapSpreeCategoriesToNavigationItems(
  categories: SpreeCategory[],
  limit = 7,
): CategoryNavigationItem[] {
  const seenIds = new Set<string>()

  return getRootCategories(categories)
    .filter((category) => {
      if (seenIds.has(category.id)) {
        return false
      }

      seenIds.add(category.id)
      return true
    })
    .slice(0, limit)
    .map((category) =>
      mapSpreeCategoryToNavigationItemFromList(category, categories),
    )
}

function getOrderedCategories(categories: SpreeCategory[]): SpreeCategory[] {
  const orderedCategories: SpreeCategory[] = []
  const seenPermalinks = new Set<string>()

  function appendCategory(category: SpreeCategory) {
    if (seenPermalinks.has(category.permalink)) {
      return
    }

    seenPermalinks.add(category.permalink)
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
): CategorySummary[] {
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
