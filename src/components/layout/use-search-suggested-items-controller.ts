import { useMarket } from './market-provider'
import type { ProductSummary } from '@/lib/catalog/contracts'
import type { SearchSuggestedItemsModel } from '@/components/contracts/search'
import { useSearchSuggestionsCarousel } from '@/components/layout/use-search-suggestions-carousel'

import { getSearchSuggestedItemsStatus } from './search-drawer/search-display'

export function useSearchSuggestedItemsController({
  failed,
  loading,
  onRetry,
  open,
  products,
}: {
  failed: boolean
  loading: boolean
  onRetry: () => void
  open: boolean
  products: ProductSummary[]
}) {
  const { market, t } = useMarket()
  const itemsKey = `${market.country}:${market.locale}:${products
    .map((product) => product.id)
    .join('\u0000')}`
  const carousel = useSearchSuggestionsCarousel({
    enabled: open && products.length > 0,
    itemsKey,
    isOpen: open,
  })
  const labels = {
    empty: t('header.noSuggestedProducts'),
    page: t('header.suggestedProducts'),
    retry: t('footer.retryInteractive'),
    section: t('header.suggestedProducts'),
    unavailable: t('header.suggestedProductsUnavailable'),
  }
  const status = getSearchSuggestedItemsStatus({
    failed,
    loading,
    resultCount: products.length,
  })
  const model = (
    status === 'ready'
      ? { indicator: carousel.state.indicator, labels, status }
      : { labels, status }
  ) satisfies SearchSuggestedItemsModel

  return {
    actions: {
      captureClick: carousel.actions.onClickCapture,
      dragStart: carousel.actions.onDragStart,
      mouseDownCapture: carousel.actions.onMouseDownCapture,
      retry: onRetry,
      scrollerRef: carousel.actions.scrollerRef,
      selectPage: carousel.actions.scrollToPage,
    },
    model,
  }
}
