export type CatalogSeoTextInput = {
  description?: string | null
  fallbackDescription: string
  fallbackTitle: string
  metaDescription?: string | null
  metaTitle?: string | null
  name?: string | null
}

export type CatalogSeoText = {
  description: string
  title: string
}

/**
 * Resolves catalog page SEO text without knowing about routes, i18n, or head
 * rendering. The runtime supplies localized fallback copy.
 */
export function getCatalogSeoText({
  description,
  fallbackDescription,
  fallbackTitle,
  metaDescription,
  metaTitle,
  name,
}: CatalogSeoTextInput): CatalogSeoText {
  return {
    description: metaDescription || description || fallbackDescription,
    title: metaTitle || name || fallbackTitle,
  }
}
