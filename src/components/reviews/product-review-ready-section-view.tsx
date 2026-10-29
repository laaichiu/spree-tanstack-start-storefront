import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type {
  ProductReviewsPaginationActions,
  ProductReviewsPaginationModel,
  ProductReviewsReadySectionModel,
  ProductReviewsReadySectionSlots,
} from '../contracts/reviews'

export type {
  ProductReviewsPaginationActions,
  ProductReviewsPaginationModel,
  ProductReviewsReadySectionModel,
  ProductReviewsReadySectionSlots,
} from '../contracts/reviews'

export function ProductReviewsReadySectionView({
  model,
  slots,
}: {
  model: ProductReviewsReadySectionModel
  slots: ProductReviewsReadySectionSlots
}) {
  const { isFetching, loadingLabel, sectionId, title } = model
  return (
    <section
      aria-busy={isFetching}
      className="mx-auto mt-14 w-full max-w-7xl scroll-mt-24 lg:mt-20"
      id={sectionId}
    >
      <div className="flex items-end justify-between gap-5">
        <h2 className="text-lg md:text-xl font-normal tracking-wider text-foreground">
          {title}
        </h2>
        {isFetching ? (
          <p className="text-xs text-muted-foreground" role="status">
            {loadingLabel}
          </p>
        ) : null}
      </div>

      <div className="mt-8">{slots.summary}</div>
      <div className="mt-8">
        {slots.controls}
        {slots.content}
        {slots.pagination}
      </div>
      {slots.mediaLightbox}
    </section>
  )
}

export function ProductReviewsPaginationView({
  actions,
  model,
}: {
  actions: ProductReviewsPaginationActions
  model: ProductReviewsPaginationModel
}) {
  const {
    hasNext,
    hasPrevious,
    isDisabled,
    navigationLabel,
    nextLabel,
    pageLabel,
    pages,
    previousLabel,
  } = model
  return (
    <nav
      aria-label={navigationLabel}
      className="mt-8 flex items-center justify-center gap-1"
    >
      <Button
        aria-label={previousLabel}
        className="h-11 w-11 transition-colors motion-reduce:transition-none"
        disabled={!hasPrevious || isDisabled}
        onClick={actions.previous}
        variant="icon"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </Button>
      <span className="sr-only" aria-live="polite">
        {pageLabel}
      </span>
      {pages.map((page) => (
        <Button
          aria-current={page.current ? 'page' : undefined}
          className={`h-10 w-10 rounded-none border-0 p-0 text-sm font-normal normal-case transition-colors motion-reduce:transition-none disabled:opacity-55 ${
            page.visibleInCompactLayout ? '' : 'hidden sm:inline-flex'
          } ${
            page.current
              ? 'bg-foreground text-background hover:bg-foreground'
              : 'text-foreground hover:bg-muted'
          }`}
          disabled={isDisabled}
          key={page.number}
          onClick={() => actions.goToPage(page.number)}
          variant="ghost"
        >
          {page.label}
        </Button>
      ))}
      <Button
        aria-label={nextLabel}
        className="h-11 w-11 transition-colors motion-reduce:transition-none"
        disabled={!hasNext || isDisabled}
        onClick={actions.next}
        variant="icon"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </Button>
    </nav>
  )
}

export function ProductReviewsListView({ children }: { children: ReactNode }) {
  return <div className="mt-8 space-y-8">{children}</div>
}
