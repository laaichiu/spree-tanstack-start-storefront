import { formatNumber } from '@/components/shared/locale-format'

export type CatalogCountLabels = {
  plural: string
  singular: string
}

export function getCatalogCountLabel(
  count: number,
  locale: string,
  labels: CatalogCountLabels,
): string {
  return `${formatNumber(count, locale)} ${
    count === 1 ? labels.singular : labels.plural
  }`
}
