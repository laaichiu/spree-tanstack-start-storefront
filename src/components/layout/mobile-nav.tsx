import { lazy, Suspense } from 'react'

import type { CategoryNavigationItem } from '@/lib/catalog/contracts'
import type { BrandNavigation } from '@/lib/brands/contracts/brand-navigation'
import {
  MobileNavDrawerContentView,
  MobileNavDrawerRootView,
} from '@/components/layout/mobile-nav-drawer-view'
import { MobileNavLoadingStateView } from '@/components/layout/mobile-nav-loading-state-view'
import { MobileNavTriggerView } from '@/components/layout/mobile-nav-trigger-view'
import { useMobileNavController } from '@/components/layout/use-mobile-nav-controller'

const MobileNavPanels = lazy(async () => {
  const module = await import('./mobile-nav/mobile-nav-panels')
  return { default: module.MobileNavPanels }
})

type MobileNavProps = {
  brands: BrandNavigation
  categories: CategoryNavigationItem[]
}

export function MobileNav({ brands, categories }: MobileNavProps) {
  const {
    handleClose,
    hasInteracted,
    marketParams,
    onTriggerClick,
    open,
    panels,
    setOpen,
    t,
  } = useMobileNavController()

  return (
    <MobileNavDrawerRootView onOpenChange={setOpen} open={open}>
      <MobileNavTriggerView
        ariaLabel={open ? t('header.closeMenu') : t('header.openMenu')}
        hasInteracted={hasInteracted}
        onClick={onTriggerClick}
        open={open}
      />

      <MobileNavDrawerContentView
        closeLabel={t('header.closeMenu')}
        hideHeader
        title={t('header.menu')}
      >
        {open && (
          <Suspense fallback={<MobileNavLoadingStateView />}>
            <MobileNavPanels
              animatedIndex={panels.state.animatedIndex}
              actions={{
                close: handleClose,
                popPanel: panels.actions.popPanel,
                pushPanel: panels.actions.pushPanel,
              }}
              categories={categories}
              brands={brands}
              isPopping={panels.state.isPopping}
              marketParams={marketParams}
              panelStack={panels.state.panelStack}
              t={t}
            />
          </Suspense>
        )}
      </MobileNavDrawerContentView>
    </MobileNavDrawerRootView>
  )
}
