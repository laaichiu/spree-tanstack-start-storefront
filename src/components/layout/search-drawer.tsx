import type { SheetHandle } from '@/components/ui/sheet'

import { SearchPreviewPanel } from './search-drawer/search-preview-panel'
import { SearchSuggestionsPanel } from './search-drawer/search-suggestions-panel'
import { SearchDrawerContentView } from '@/components/layout/search-drawer-content-view'
import { SearchDrawerShellView } from '@/components/layout/search-drawer-shell-view'
import { SearchFormView } from '@/components/layout/search-form-view'
import { useSearchDrawerController } from './use-search-drawer-controller'

type SearchDrawerProps = {
  handle: SheetHandle
  onOpenChange: (open: boolean, triggerId?: string | null) => void
  onReady: () => void
  open: boolean
  triggerId: string | null
}

export function SearchDrawer({
  handle,
  onOpenChange,
  onReady,
  open,
  triggerId,
}: SearchDrawerProps) {
  const {
    activeSearchQuery,
    inputRef,
    onChangeQuery,
    onNavigateToSearchResults,
    onSelect,
    previewQuery,
    query,
    searchMode,
    submitSearch,
    suggestionsQuery,
    t,
  } = useSearchDrawerController({
    onOpenChange,
    onReady,
    open,
  })

  return (
    <SearchDrawerShellView
      closeLabel={t('header.closeSearch')}
      handle={handle}
      open={open}
      onOpenChange={onOpenChange}
      slots={{
        content: (
          <SearchDrawerContentView
            mode={searchMode}
            slots={{
              preview: (
                <SearchPreviewPanel
                  activeSearchLabel={activeSearchQuery}
                  failed={previewQuery.isError}
                  loading={previewQuery.isFetching}
                  onNavigateToSearchResults={onNavigateToSearchResults}
                  onSelect={onSelect}
                  open={open}
                  results={previewQuery.data?.products ?? []}
                />
              ),
              suggestions: (
                <SearchSuggestionsPanel
                  failed={suggestionsQuery.isError}
                  loading={suggestionsQuery.isPending}
                  onNavigateToSearchResults={onNavigateToSearchResults}
                  onRetry={() => void suggestionsQuery.refetch()}
                  onSelect={onSelect}
                  open={open}
                  products={suggestionsQuery.data ?? []}
                />
              ),
            }}
          />
        ),
        form: (
          <SearchFormView
            inputRef={inputRef}
            label={t('header.search')}
            onChange={onChangeQuery}
            onSubmit={submitSearch}
            placeholder={t('header.searchPlaceholder')}
            submitLabel={t('header.viewSearchResults')}
            value={query}
          />
        ),
      }}
      title={t('header.search')}
      triggerId={triggerId}
    />
  )
}
