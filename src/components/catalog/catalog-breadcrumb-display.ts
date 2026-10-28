import type { CatalogBreadcrumbDisplay } from '@/components/contracts/catalog/links'

export function getCatalogBreadcrumbDisplays(
  items: readonly { id: string; name: string }[],
  currentId?: string,
): CatalogBreadcrumbDisplay[] {
  return items.map((item) => ({
    id: item.id,
    ...(currentId === undefined ? {} : { isCurrent: item.id === currentId }),
    label: item.name,
  }))
}
