/**
 * Consumer-facing projection of Spree's optional Seller resource.
 *
 * The storefront calls this projection a Brand, while the backend identity
 * remains Seller so deployment copy can use another label.
 */
export type BrandProfile = {
  about: string
  aboutHtml: string
  coverPhotoUrl: string | null
  id: string
  logoUrl: string | null
  name: string
  slug: string
  squareLogoUrl: string | null
}

export type BrandDirectoryPageModel =
  { status: 'error' } | { brands: readonly BrandProfile[]; status: 'ready' }
