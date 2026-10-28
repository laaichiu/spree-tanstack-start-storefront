import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import { useMarket } from '@/components/layout/market-provider'
import type { DesktopMegaMenuPanelActions } from '@/components/contracts/layout'
import { DesktopMegaMenuFeaturedLinkView } from '@/components/layout/desktop-mega-menu-featured-link-view'
import { DesktopMegaMenuPanelView } from '@/components/layout/desktop-mega-menu-panel-view'

import { DesktopMegaMenuCategoryLinks } from './desktop-mega-menu-category-links'

type DesktopMegaMenuPanelProps = {
  activeCategory: CategoryNavigationItem
  activePanelId: string
  actions: DesktopMegaMenuPanelActions
  marketParams: { country: string; locale: string }
  panelRef: React.RefObject<HTMLDivElement | null>
  pathname: string
}

export function DesktopMegaMenuPanel({
  activeCategory,
  activePanelId,
  actions,
  marketParams,
  panelRef,
  pathname,
}: DesktopMegaMenuPanelProps) {
  const { t } = useMarket()

  return (
    <DesktopMegaMenuPanelView
      activePanelId={activePanelId}
      closeLabel={t('header.closeMenu')}
      hasFeaturedImage={Boolean(activeCategory.imageUrl)}
      slots={{
        featuredLink: activeCategory.imageUrl && (
          <DesktopMegaMenuFeaturedLinkView
            imageAlt={activeCategory.name}
            imageUrl={activeCategory.imageUrl}
            label={`${t('home.shop')} ${activeCategory.name}`}
            renderLink={(content, className) => (
              <Link
                className={className}
                onClick={actions.close}
                params={{
                  ...marketParams,
                  _splat: activeCategory.permalink,
                }}
                search={DEFAULT_PRODUCT_LISTING_SEARCH}
                to="/$country/$locale/collections/$"
              >
                {content}
              </Link>
            )}
          />
        ),
        links: (
          <DesktopMegaMenuCategoryLinks
            activeCategory={activeCategory}
            allLabel={t('home.all')}
            marketParams={marketParams}
            onClose={actions.close}
            pathname={pathname}
          />
        ),
      }}
      actions={actions}
      panelRef={panelRef}
      title={activeCategory.name}
    />
  )
}
