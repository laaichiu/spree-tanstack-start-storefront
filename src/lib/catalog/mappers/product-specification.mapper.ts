import type {
  CustomField as SpreeCustomField,
  Product as SpreeProduct,
} from '@spree/sdk'

import type { ProductSpecification } from '@/lib/catalog/contracts'
import { SEARCH_SUGGESTION_POSITION_FIELD } from '@/config/search'

function normalizeCustomFieldType(type: string) {
  return type.split('::').pop()?.toLowerCase() ?? type.toLowerCase()
}

function formatCustomFieldValue(field: SpreeCustomField): string {
  const normalizedType = normalizeCustomFieldType(field.field_type)

  if (normalizedType === 'boolean') {
    return field.value ? 'Yes' : 'No'
  }

  if (normalizedType === 'json') {
    return typeof field.value === 'string'
      ? field.value
      : JSON.stringify(field.value)
  }

  if (field.value === null || field.value === undefined) {
    return '-'
  }

  return String(field.value)
}

function stripHtmlTags(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function mapProductSpecifications(
  product: SpreeProduct,
): ProductSpecification[] {
  return (product.custom_fields ?? [])
    .filter((field) => field.key !== SEARCH_SUGGESTION_POSITION_FIELD)
    .map((field) => {
      const normalizedType = normalizeCustomFieldType(field.field_type)
      const value =
        normalizedType === 'rich_text' && typeof field.value === 'string'
          ? stripHtmlTags(field.value)
          : formatCustomFieldValue(field)

      return {
        label: field.label,
        value,
      }
    })
}
