import type { ReactNode } from 'react'

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
      className="mx-auto mt-14 w-full max-w-[78rem] scroll-mt-24 lg:mt-20"
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
    previousLabel,
  } = model
  return (
    <nav
      aria-label={navigationLabel}
      className="mt-8 flex items-center justify-between gap-4"
    >
      <Button
        disabled={!hasPrevious || isDisabled}
        onClick={actions.previous}
        variant="secondary"
      >
        {previousLabel}
      </Button>
      <p className="text-xs text-muted-foreground">{pageLabel}</p>
      <Button
        disabled={!hasNext || isDisabled}
        onClick={actions.next}
        variant="secondary"
      >
        {nextLabel}
      </Button>
    </nav>
  )
}

export function ProductReviewsListView({ children }: { children: ReactNode }) {
  return <div className="mt-8 space-y-8">{children}</div>
}
