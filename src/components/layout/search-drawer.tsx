import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { useDeferredValue, useEffect, useRef, useState } from 'react'
import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/model/product-listing'

import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SheetHandle } from '@/components/ui/sheet'
import type { CategoryNavigationItem } from '@/lib/catalog/model/category'
import { useMarket } from '@/components/layout/market-provider'
import { useProductSearchPreview } from '@/components/layout/search-drawer/use-product-search-preview'
import { useSearchSuggestions } from '@/components/layout/search-drawer/use-search-suggestions'

import {
  CATEGORY_LINK_LIMIT,
  SEARCH_PREVIEW_MIN_QUERY_LENGTH,
} from './search-drawer/search-drawer.model'
import { SearchPreviewPanel } from './search-drawer/search-preview-panel'
import { SearchSuggestionsPanel } from './search-drawer/search-suggestions-panel'

type SearchDrawerProps = {
  categories: CategoryNavigationItem[]
  handle: SheetHandle
  onOpenChange: (open: boolean, triggerId?: string | null) => void
  onReady: () => void
  open: boolean
  triggerId: string | null
}

export function SearchDrawer({
  categories,
  handle,
  onOpenChange,
  onReady,
  open,
  triggerId,
}: SearchDrawerProps) {
  const { market, t } = useMarket()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const trimmedQuery = query.trim()
  const deferredQuery = useDeferredValue(trimmedQuery)
  const hasSearchPreview =
    deferredQuery.length >= SEARCH_PREVIEW_MIN_QUERY_LENGTH
  const categoryLinks = categories.slice(0, CATEGORY_LINK_LIMIT)
  const previewQuery = useProductSearchPreview({
    enabled: open && hasSearchPreview,
    limit: 8,
    query: deferredQuery,
  })
  const suggestionsQuery = useSearchSuggestions({
    enabled: open && !hasSearchPreview,
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
    setQuery('')
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateToSearch(query)
  }

  return (
    <Sheet
      handle={handle}
      onOpenChange={(nextOpen, eventDetails) =>
        onOpenChange(nextOpen, eventDetails.trigger?.id ?? null)
      }
      open={open}
      triggerId={triggerId}
    >
      <SheetContent>
        <SheetHeader className="justify-end px-5 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6">
          <SheetTitle className="sr-only">{t('header.search')}</SheetTitle>
          <SheetCloseButton
            aria-label={t('header.closeSearch')}
            className="-mr-1.5 p-1.5"
          />
        </SheetHeader>
        <form className="px-5 sm:px-6" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="storefront-search-input">
            {t('header.search')}
          </label>
          <div className="flex items-center gap-3 border-b border-border pb-3 text-foreground">
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <input
              className="text-lg leading-6 w-full border-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              id="storefront-search-input"
              inputMode="search"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  navigateToSearch(query)
                }
              }}
              placeholder={t('header.searchPlaceholder')}
              ref={inputRef}
              type="text"
              value={query}
            />
            <button
              aria-label={t('header.viewSearchResults')}
              className="rounded-full p-1 text-foreground transition-colors hover:text-muted-foreground focus-visible:focus-ring"
              type="submit"
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {hasSearchPreview ? (
            <SearchPreviewPanel
              activeSearchLabel={deferredQuery}
              categories={categoryLinks}
              failed={previewQuery.isError}
              loading={previewQuery.isFetching}
              onNavigateToSearchResults={navigateToSearch}
              onSelect={closeAfterSelection}
              results={previewQuery.data?.products ?? []}
            />
          ) : (
            <SearchSuggestionsPanel
              categories={categoryLinks}
              failed={suggestionsQuery.isError}
              loading={suggestionsQuery.isPending}
              onNavigateToSearchResults={navigateToSearch}
              onRetry={() => void suggestionsQuery.refetch()}
              onSelect={closeAfterSelection}
              open={open}
              products={suggestionsQuery.data ?? []}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
