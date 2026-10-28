import type { Seller as SpreeSeller } from '@spree/sdk'

import type { BrandProfile } from '@/lib/brands/contracts'
import { sanitizeRichTextHtml } from '@/lib/catalog/utils/sanitize-rich-text'

export function mapSpreeSellerToBrand(seller: SpreeSeller): BrandProfile {
  return {
    about: seller.about,
    aboutHtml: sanitizeRichTextHtml(seller.about_html),
    coverPhotoUrl: seller.cover_photo_url,
    id: seller.id,
    logoUrl: seller.logo_url,
    name: seller.name,
    slug: seller.slug,
    squareLogoUrl: seller.square_logo_url,
  }
}
