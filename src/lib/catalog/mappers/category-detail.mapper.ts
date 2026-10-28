import type { Category as SpreeCategory } from '@spree/sdk'

import type {
  CategoryBreadcrumbItem,
  CategoryDetail,
} from '@/lib/catalog/contracts'
import { mapSpreeCategoryToSummary } from './category-summary.mapper'

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
