import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  RefCallback,
} from 'react'

export type SearchSuggestedItemsStatus = 'empty' | 'error' | 'loading' | 'ready'

export type SearchSuggestionsIndicatorState = {
  activePage: number
  hasOverflow: boolean
  pageCount: number
  progress: number
  thumbWidthPercent: number
}

export type SearchSuggestedItemsModel = {
  labels: {
    empty: string
    page: string
    retry: string
    section: string
    unavailable: string
  }
} & (
  | {
      indicator: SearchSuggestionsIndicatorState
      status: 'ready'
    }
  | {
      status: 'empty'
    }
  | {
      status: 'error'
    }
  | {
      status: 'loading'
    }
)

export type SearchSuggestedItemsActions = {
  captureClick: (event: ReactMouseEvent<HTMLUListElement>) => void
  dragStart: (event: DragEvent<HTMLUListElement>) => void
  mouseDownCapture: (event: ReactMouseEvent<HTMLUListElement>) => void
  retry: () => void
  selectPage: (pageIndex: number) => void
  scrollerRef: RefCallback<HTMLUListElement>
}
