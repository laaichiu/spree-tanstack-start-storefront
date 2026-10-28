import type { Category, Product } from '@spree/sdk'

import { SEARCH_SUGGESTION_POSITION_FIELD } from '@/config/search'

import { mapSpreeCategoryToSummary } from './category-summary.mapper'
import { assertCatalogProductResponse } from './product-response'
import { mapSpreeProductToSummary } from './product.mapper'
import {
  assertCatalogCategoryTreeResourcesAreCategories,
  assertCatalogProductNestedCategoriesAreCategories,
  assertCatalogProductNestedMediaBelongToProduct,
  assertCatalogProductNestedVariantsBelongToProduct,
  assertCatalogProductResourceIsProduct,
} from '../utils/catalog-resource-identity'

export class SearchSuggestionResponseError extends Error {
  constructor() {
    super('The search suggestion response is malformed.')
    this.name = 'SearchSuggestionResponseError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getPosition(resource: { custom_fields?: unknown }): number | null {
  // The relationship is requested explicitly. An omitted expansion is an
  // invalid response; an expanded empty array means the record is not selected.
  if (!Array.isArray(resource.custom_fields)) {
    throw new SearchSuggestionResponseError()
  }

  let position: number | null = null
  let selected = false
  for (const field of resource.custom_fields) {
    if (
      !isRecord(field) ||
      typeof field.id !== 'string' ||
      !field.id.startsWith('cf_') ||
      field.id.length <= 3 ||
      typeof field.key !== 'string' ||
      typeof field.label !== 'string' ||
      typeof field.field_type !== 'string'
    ) {
      throw new SearchSuggestionResponseError()
    }
    if (field.key !== SEARCH_SUGGESTION_POSITION_FIELD) continue
    if (selected || field.field_type !== 'number') {
      throw new SearchSuggestionResponseError()
    }
    selected = true

    // Spree serializes Number custom fields as decimal strings (BigDecimal).
    // Accept that transport form deliberately, without coercing other values.
    const value: unknown = field.value
    if (
      typeof value !== 'number' &&
      !(typeof value === 'string' && /^-?\d+(?:\.\d+)?$/.test(value))
    ) {
      throw new SearchSuggestionResponseError()
    }
    const number = Number(value)
    if (!Number.isFinite(number)) throw new SearchSuggestionResponseError()
    const integerValue =
      typeof value === 'number' || /^-?\d+(?:\.0+)?$/.test(value)
    position =
      integerValue && Number.isSafeInteger(number) && number > 0 ? number : null
  }
  return position
}

function selectResources<T extends { id: string; custom_fields?: unknown }>(
  resources: T[],
  limit: number,
): T[] {
  const seen = new Set<string>()
  return resources
    .flatMap((resource) => {
      if (seen.has(resource.id)) throw new SearchSuggestionResponseError()
      seen.add(resource.id)
      const position = getPosition(resource)
      return position === null ? [] : [{ position, resource }]
    })
    .sort(
      (a, b) =>
        a.position - b.position || a.resource.id.localeCompare(b.resource.id),
    )
    .slice(0, limit)
    .map(({ resource }) => resource)
}

export function mapSearchSuggestionProducts(
  products: Product[],
  limit: number,
) {
  products.forEach((product) => {
    assertCatalogProductResourceIsProduct(product)
    assertCatalogProductNestedCategoriesAreCategories(product)
    assertCatalogProductNestedVariantsBelongToProduct(product)
    assertCatalogProductResponse(product)
    assertCatalogProductNestedMediaBelongToProduct(product)
  })
  return selectResources(products, limit).map(mapSpreeProductToSummary)
}

export function mapSearchSuggestionCategories(
  categories: Category[],
  limit: number,
) {
  assertCatalogCategoryTreeResourcesAreCategories(categories)
  return selectResources(categories, limit).map((category) => ({
    ...mapSpreeCategoryToSummary(category),
    children: [],
  }))
}
