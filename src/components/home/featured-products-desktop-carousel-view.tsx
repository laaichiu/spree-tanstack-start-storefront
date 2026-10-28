import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'

const DESKTOP_PRODUCTS_PER_PAGE = 6

function getFeaturedProductPages(cards: readonly ReactNode[]) {
  const pages: ReactNode[][] = []

  for (
    let index = 0;
    index < cards.length;
    index += DESKTOP_PRODUCTS_PER_PAGE
  ) {
    pages.push(cards.slice(index, index + DESKTOP_PRODUCTS_PER_PAGE))
  }

  return pages
}

type FeaturedProductsDesktopCarouselProps = {
  cards: readonly ReactNode[]
  nextPageLabel: string
  previousPageLabel: string
}

export function FeaturedProductsDesktopCarouselView({
  cards,
  nextPageLabel,
  previousPageLabel,
}: FeaturedProductsDesktopCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0)
  const pages = getFeaturedProductPages(cards)
  const safePageIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0))
  const hasNext = safePageIndex < pages.length - 1
  const hasPrevious = safePageIndex > 0

  function goToPage(nextPage: number) {
    if (
      nextPage < 0 ||
      nextPage >= pages.length ||
      nextPage === safePageIndex
    ) {
      return
    }

    setPageIndex(nextPage)
  }

  return (
    <div className="relative hidden lg:block">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{
            transform: `translateX(-${safePageIndex * 100}%)`,
          }}
        >
          {pages.map((page, pageNumber) => (
            <div className="grid min-w-full grid-cols-6 gap-4" key={pageNumber}>
              {page}
            </div>
          ))}
        </div>
      </div>

      {hasPrevious && (
        <button
          aria-label={previousPageLabel}
          className="absolute top-1/2 left-0 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center bg-background/70 text-foreground transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => goToPage(safePageIndex - 1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
      )}

      {hasNext && (
        <button
          aria-label={nextPageLabel}
          className="absolute top-1/2 right-0 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center bg-background/70 text-foreground transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => goToPage(safePageIndex + 1)}
          type="button"
        >
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
