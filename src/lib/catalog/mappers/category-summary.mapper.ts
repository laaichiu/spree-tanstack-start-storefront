import type { Category as SpreeCategory } from '@spree/sdk'

import type { CatalogCategoryReference } from '@/lib/catalog/contracts'

export function mapSpreeCategoryToSummary(
  category: SpreeCategory,
): CatalogCategoryReference {
  return {
    id: category.id,
    imageUrl: category.image_url ?? category.square_image_url,
    name: category.name,
    permalink: category.permalink,
  }
}
