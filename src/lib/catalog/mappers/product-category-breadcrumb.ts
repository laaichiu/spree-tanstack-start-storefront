import type { Category as SpreeCategory } from '@spree/sdk'

export function getPreferredProductBreadcrumbCategory(
  categories: readonly SpreeCategory[],
): SpreeCategory | null {
  const nonRootCategories = categories.filter(
    (category) => category.parent_id !== null,
  )

  return (
    [...nonRootCategories]
      .sort((first, second) => second.depth - first.depth)
      .at(0) ??
    categories.at(0) ??
    null
  )
}
