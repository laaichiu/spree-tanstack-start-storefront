export type CatalogSeoTextInput = {
  description?: string | null
  fallbackTitle: string
  metaDescription?: string | null
  metaTitle?: string | null
  name?: string | null
}

export type CatalogSeoText = {
  description: string | null
  title: string
}

/** Resolves catalog-owned SEO fields; the route supplies localized fallbacks. */
export function getCatalogSeoText({
  description,
  fallbackTitle,
  metaDescription,
  metaTitle,
  name,
}: CatalogSeoTextInput): CatalogSeoText {
  return {
    description: metaDescription || description || null,
    title: metaTitle || name || fallbackTitle,
  }
}
