export type SeoMetaEntry =
  | { title: string }
  | { content: string; name: string }
  | { content: string; property: string }

export type SeoImage = {
  alt: string
  url: string
}

export type SeoRobotsDirective = 'noindex, follow' | 'noindex, nofollow'

export type SeoMetaInput = {
  canonicalUrl?: string | null
  description: string
  image?: SeoImage | null
  noIndex?: boolean
  ogType?: 'product' | 'website'
  robots?: SeoRobotsDirective
  title: string
}

export type StructuredData = Record<string, unknown>

export type SeoAlternateLink = {
  href: string
  hreflang: string
}
