import { lazy, Suspense } from 'react'
import { Link } from '@tanstack/react-router'

import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import { DesktopMegaMenuNavigationView } from '@/components/layout/desktop-mega-menu-navigation-view'
import { DesktopMegaMenuLinkView } from '@/components/layout/desktop-mega-menu-link-view'
import { useDesktopMegaMenuController } from '@/components/layout/use-desktop-mega-menu-controller'

import { DesktopMegaMenuCategoryTriggers } from './desktop-mega-menu/desktop-mega-menu-category-triggers'

const DesktopMegaMenuPanel = lazy(async () => {
  const module = await import('./desktop-mega-menu/desktop-mega-menu-panel')
  return { default: module.DesktopMegaMenuPanel }
})

const DesktopMegaMenuBrandPanel = lazy(async () => {
  const module =
    await import('./desktop-mega-menu/desktop-mega-menu-brand-panel')
  return { default: module.DesktopMegaMenuBrandPanel }
})

type DesktopMegaMenuProps = {
  brands: BrandNavigation
  categories: CategoryNavigationItem[]
}

export function DesktopMegaMenu({ brands, categories }: DesktopMegaMenuProps) {
  const {
    activeItemId,
    activeCategory,
    activePanelId,
    cancelScheduledClose,
    closeMenu,
    brandMenuId,
    handleBrandsEnter,
    isBrandsOpen,
    isCurrentBrand,
    currentCategoryId,
    handleCategoryEnter,
    marketParams,
    panelRef,
    rootRef,
    scheduleClose,
    triggerRefs,
    pathname,
    t,
  } = useDesktopMegaMenuController({ brands, categories })

  if (categories.length === 0 && !brands.enabled) {
    return null
  }

  function renderActivePanel() {
    if (isBrandsOpen && activePanelId) {
      return (
        <Suspense fallback={null}>
          <DesktopMegaMenuBrandPanel
            activePanelId={activePanelId}
            actions={{
              cancelScheduledClose,
              close: closeMenu,
              scheduleClose,
            }}
            brands={brands}
            marketParams={marketParams}
            panelRef={panelRef}
          />
        </Suspense>
      )
    }

    if (!activeCategory || !activePanelId) {
      return null
    }

    return (
      <Suspense fallback={null}>
        <DesktopMegaMenuPanel
          activeCategory={activeCategory}
          activePanelId={activePanelId}
          marketParams={marketParams}
          actions={{
            cancelScheduledClose,
            close: closeMenu,
            scheduleClose,
          }}
          panelRef={panelRef}
          pathname={pathname}
        />
      </Suspense>
    )
  }

  return (
    <DesktopMegaMenuNavigationView
      actions={{
        cancelScheduledClose,
        scheduleClose,
      }}
      navLabel={t('header.categories')}
      rootRef={rootRef}
      slots={{
        links: (
          <>
            {brands.enabled && (
              <DesktopMegaMenuLinkView
                renderLink={(content, className) => (
                  <Link
                    aria-controls={isBrandsOpen ? activePanelId : undefined}
                    aria-expanded={isBrandsOpen}
                    aria-haspopup="true"
                    className={className}
                    data-underline-active={
                      isBrandsOpen || isCurrentBrand ? 'true' : undefined
                    }
                    onClick={closeMenu}
                    onFocus={handleBrandsEnter}
                    onMouseEnter={handleBrandsEnter}
                    onPointerEnter={handleBrandsEnter}
                    params={marketParams}
                    preload={false}
                    ref={(node) => {
                      if (node) triggerRefs.current.set(brandMenuId, node)
                      else triggerRefs.current.delete(brandMenuId)
                    }}
                    search={{}}
                    to="/$country/$locale/brands"
                  >
                    {content}
                  </Link>
                )}
                tone="default"
              >
                {t('brand.directory')}
              </DesktopMegaMenuLinkView>
            )}
            <DesktopMegaMenuCategoryTriggers
              activeCategoryId={activeItemId}
              activePanelId={activePanelId}
              categories={categories}
              currentCategoryId={currentCategoryId}
              marketParams={marketParams}
              onCategoryEnter={handleCategoryEnter}
              onClose={closeMenu}
              triggerRefs={triggerRefs}
            />
          </>
        ),
        panel: renderActivePanel(),
      }}
    />
  )
}
