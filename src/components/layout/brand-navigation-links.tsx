import { Link } from '@tanstack/react-router'

import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import { DEFAULT_BRAND_SEARCH } from '@/lib/brands/contracts'

import { DesktopMegaMenuPanelLinkView } from './desktop-mega-menu-panel-link-view'
import { MobileNavSecondaryLinkView } from './mobile-nav-secondary-link-view'

export function BrandNavigationLinks({
  allLabel,
  brands,
  marketParams,
  mobile = false,
  onClose,
}: {
  allLabel: string
  brands: BrandNavigation
  marketParams: { country: string; locale: string }
  mobile?: boolean
  onClose: () => void
}) {
  const LinkView = mobile
    ? MobileNavSecondaryLinkView
    : DesktopMegaMenuPanelLinkView

  return (
    <>
      <LinkView
        renderLink={(content, className) => (
          <Link
            className={className}
            onClick={onClose}
            params={marketParams}
            search={{}}
            to="/$country/$locale/brands"
          >
            {content}
          </Link>
        )}
      >
        {allLabel}
      </LinkView>
      {brands.items.map((brand) => (
        <LinkView
          key={brand.id}
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
        >
          {brand.name}
        </LinkView>
      ))}
    </>
  )
}
