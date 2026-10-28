import type { RefObject } from 'react'

import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import type { DesktopMegaMenuPanelActions } from '@/components/contracts/layout'
import { useMarket } from '@/components/layout/market-provider'
import { DesktopMegaMenuPanelView } from '@/components/layout/desktop-mega-menu-panel-view'
import { BrandNavigationFeaturedLink } from '@/components/layout/brand-navigation-featured-link'
import { BrandNavigationLinks } from '@/components/layout/brand-navigation-links'

export function DesktopMegaMenuBrandPanel({
  actions,
  activePanelId,
  brands,
  marketParams,
  panelRef,
}: {
  actions: DesktopMegaMenuPanelActions
  activePanelId: string
  brands: BrandNavigation
  marketParams: { country: string; locale: string }
  panelRef: RefObject<HTMLDivElement | null>
}) {
  const { t } = useMarket()

  return (
    <DesktopMegaMenuPanelView
      actions={actions}
      activePanelId={activePanelId}
      closeLabel={t('header.closeMenu')}
      hasFeaturedImage={Boolean(brands.featuredBrand?.imageUrl)}
      panelRef={panelRef}
      slots={{
        links: (
          <BrandNavigationLinks
            allLabel={t('brand.viewAllBrands')}
            brands={brands}
            marketParams={marketParams}
            onClose={actions.close}
          />
        ),
        featuredLink: (
          <BrandNavigationFeaturedLink
            brand={brands.featuredBrand}
            label={`${t('home.shop')} ${brands.featuredBrand?.name ?? ''}`}
            marketParams={marketParams}
            onClose={actions.close}
          />
        ),
      }}
      title={t('brand.featuredBrands')}
    />
  )
}
