import { useLocation } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

import {
  MobileNavDrawerContent,
  MobileNavDrawerRoot,
  MobileNavDrawerTrigger,
} from '@/components/layout/mobile-nav-drawer'
import { useMarket } from '@/components/layout/market-provider'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { cn } from '@/lib/utils'

import { PANEL_TRANSITION_MS } from './mobile-nav/mobile-nav.model'
import type { MenuPanel } from './mobile-nav/mobile-nav.model'

const MobileNavPanels = lazy(async () => {
  const module = await import('./mobile-nav/mobile-nav-panels')
  return { default: module.MobileNavPanels }
})

type MobileNavProps = {
  categories: CategoryNavigationItem[]
}

export function MobileNav({ categories }: MobileNavProps) {
  const { market, t } = useMarket()
  const [open, setOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [panelStack, setPanelStack] = useState<MenuPanel[]>([{ kind: 'main' }])
  const [animatedIndex, setAnimatedIndex] = useState(0)
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const marketParams = { country: market.country, locale: market.locale }

  const cancelPendingCallbacks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resetPanels = useCallback(() => {
    cancelPendingCallbacks()
    setPanelStack([{ kind: 'main' }])
    setAnimatedIndex(0)
  }, [cancelPendingCallbacks])

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const pushPanel = useCallback(
    (panel: MenuPanel) => {
      cancelPendingCallbacks()
      flushSync(() => {
        setPanelStack((previous) => [...previous, panel])
      })

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setAnimatedIndex((previous) => previous + 1)
      })
    },
    [cancelPendingCallbacks],
  )

  const popPanel = useCallback(() => {
    if (panelStack.length <= 1) {
      return
    }

    cancelPendingCallbacks()
    setAnimatedIndex((previous) => Math.max(0, previous - 1))
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      setPanelStack((previous) =>
        previous.length > 1 ? previous.slice(0, -1) : previous,
      )
    }, PANEL_TRANSITION_MS)
  }, [cancelPendingCallbacks, panelStack.length])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) {
      resetPanels()
    }
  }, [open, resetPanels])

  useEffect(() => {
    return () => cancelPendingCallbacks()
  }, [cancelPendingCallbacks])

  return (
    <MobileNavDrawerRoot onOpenChange={setOpen} open={open}>
      <MobileNavDrawerTrigger
        aria-expanded={open}
        aria-label={open ? t('header.closeMenu') : t('header.openMenu')}
        className="relative z-[60] inline-flex h-10 w-10 cursor-pointer items-center justify-center bg-transparent text-foreground transition-colors hover:bg-transparent hover:text-muted-foreground lg:hidden"
        onClick={() => setHasInteracted(true)}
        type="button"
      >
        <span className="relative block h-5 w-5">
          <span
            className={cn(
              'absolute top-0.5 right-0 left-0 h-0.5 rounded-full bg-current transition-transform duration-300 ease-in-out',
              hasInteracted && open ? 'translate-y-[7px] rotate-45' : null,
            )}
          />
          <span
            className={cn(
              'absolute top-1/2 right-0 left-0 h-0.5 -translate-y-1/2 rounded-full bg-current transition-opacity duration-150 ease-in-out',
              hasInteracted && open ? 'opacity-0' : 'opacity-100',
            )}
          />
          <span
            className={cn(
              'absolute right-0 bottom-0.5 left-0 h-0.5 rounded-full bg-current transition-transform duration-300 ease-in-out',
              hasInteracted && open ? '-translate-y-[7px] -rotate-45' : null,
            )}
          />
        </span>
      </MobileNavDrawerTrigger>

      <MobileNavDrawerContent
        closeLabel={t('header.closeMenu')}
        hideHeader
        title={t('header.menu')}
      >
        {open ? (
          <Suspense fallback={<div className="flex-1 bg-popover" />}>
            <MobileNavPanels
              animatedIndex={animatedIndex}
              categories={categories}
              marketParams={marketParams}
              onClose={handleClose}
              onPopPanel={popPanel}
              onPushPanel={pushPanel}
              panelStack={panelStack}
              t={t}
            />
          </Suspense>
        ) : null}
      </MobileNavDrawerContent>
    </MobileNavDrawerRoot>
  )
}
