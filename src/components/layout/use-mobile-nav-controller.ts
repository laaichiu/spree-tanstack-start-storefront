import { useLocation } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import type { CategoryNavigationItem } from '@/lib/catalog/contracts'

import { useMarket } from './market-provider'
import { useMobileNavPanels } from './use-mobile-nav-panels'

export function useMobileNavController() {
  const { market, t } = useMarket()
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
  const [open, setOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const marketParams = { country: market.country, locale: market.locale }
  const panels = useMobileNavPanels<CategoryNavigationItem>({
    open,
    resetKey: `${market.country}:${market.locale}`,
  })

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 80rem)')
    function handleChange() {
      if (desktop.matches) setOpen(false)
    }
    desktop.addEventListener('change', handleChange)
    return () => desktop.removeEventListener('change', handleChange)
  }, [])

  return {
    hasInteracted,
    handleClose,
    marketParams,
    onTriggerClick: () => setHasInteracted(true),
    open,
    panels,
    setOpen,
    t,
  }
}
