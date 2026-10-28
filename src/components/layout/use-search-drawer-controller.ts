import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { useSearchDrawerState } from '@/lib/catalog/client/use-search-drawer-state'

import { useMarket } from './market-provider'

type UseSearchDrawerControllerOptions = {
  onOpenChange: (open: boolean, triggerId?: string | null) => void
  onReady: () => void
  open: boolean
}

export function useSearchDrawerController({
  onOpenChange,
  onReady,
  open,
}: UseSearchDrawerControllerOptions) {
  const { market, t } = useMarket()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const searchState = useSearchDrawerState({
    enabled: open,
    market,
  })

  useEffect(() => {
    onReady()
  }, [onReady])

  useEffect(() => {
    if (!open) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [open])

  function closeAfterSelection() {
    searchState.reset()
    onOpenChange(false)
  }

  function navigateToSearch(nextQuery: string) {
    closeAfterSelection()
    void navigate({
      params: marketParams,
      search: {
        ...DEFAULT_PRODUCT_LISTING_SEARCH,
        q: nextQuery.trim() || undefined,
      },
      to: '/$country/$locale/products',
    })
  }

  return {
    ...searchState,
    inputRef,
    onNavigateToSearchResults: navigateToSearch,
    onSelect: closeAfterSelection,
    submitSearch: () => navigateToSearch(searchState.query),
    t,
  }
}
