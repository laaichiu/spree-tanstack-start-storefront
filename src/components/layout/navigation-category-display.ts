import type { CategoryNavigationItem } from '@/lib/catalog/contracts'

export function isSaleCategory(
  category: Pick<CategoryNavigationItem, 'name' | 'permalink'>,
) {
  const hasSalePermalink = category.permalink
    .toLowerCase()
    .split('/')
    .includes('sale')

  return hasSalePermalink || category.name.trim().toLowerCase() === 'sale'
}
