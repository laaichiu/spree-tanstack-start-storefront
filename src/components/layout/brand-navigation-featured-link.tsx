import { Link } from '@tanstack/react-router'

import { DEFAULT_BRAND_SEARCH } from '@/lib/brands/contracts'
import type { BrandNavigationItem } from '@/lib/brands/contracts/brand-navigation'

import { DesktopMegaMenuFeaturedLinkView } from './desktop-mega-menu-featured-link-view'

export function BrandNavigationFeaturedLink({
  brand,
  label,
  marketParams,
  onClose,
}: {
  brand: BrandNavigationItem | null
  label: string
  marketParams: { country: string; locale: string }
  onClose: () => void
}) {
  if (!brand?.imageUrl) return null

  return (
    <DesktopMegaMenuFeaturedLinkView
      imageAlt={brand.name}
      imageUrl={brand.imageUrl}
      label={label}
      renderLink={(content, className) => (
        <Link
          className={className}
          onClick={onClose}
          params={{ ...marketParams, slug: brand.slug }}
          search={DEFAULT_BRAND_SEARCH}
          to="/$country/$locale/$slug"
        >
          {content}
        </Link>
      )}
    />
  )
}
