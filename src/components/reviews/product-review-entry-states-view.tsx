import { CircleAlert, MessageSquareText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type {
  ProductReviewsEmptyStateModel,
  ProductReviewsLoadErrorStateModel,
  ProductReviewsNoResultsStateModel,
  ProductReviewsUnavailableStateModel,
} from '../contracts/reviews'

export type {
  ProductReviewsEmptyStateModel,
  ProductReviewsLoadErrorStateModel,
  ProductReviewsNoResultsStateModel,
  ProductReviewsUnavailableStateModel,
} from '../contracts/reviews'

export function ProductReviewsUnavailableStateView({
  model,
}: {
  model: ProductReviewsUnavailableStateModel
}) {
  return (
    <section
      className="mx-auto mt-14 w-full max-w-7xl scroll-mt-24 border-t border-border pt-10 lg:mt-20"
      id={model.sectionId}
    >
      <div className="flex gap-3 bg-muted px-5 py-6 text-muted-foreground">
        <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h2 className="text-lg md:text-xl font-normal text-foreground">
            {model.title}
          </h2>
          <p className="mt-1 text-xs leading-6">{model.description}</p>
        </div>
      </div>
    </section>
  )
}

export function ProductReviewsEmptyStateView({
  model,
}: {
  model: ProductReviewsEmptyStateModel
}) {
  return (
    <section
      className="mx-auto mt-14 w-full max-w-7xl scroll-mt-24 lg:mt-20"
      id={model.sectionId}
    >
      <h2 className="text-lg md:text-xl font-normal tracking-wider text-foreground">
        {model.title}
      </h2>
      <div className="mt-6 bg-muted px-6 py-10 text-xs text-muted-foreground sm:px-8">
        {model.message}
      </div>
    </section>
  )
}

export function ProductReviewsNoResultsStateView({
  model,
}: {
  model: ProductReviewsNoResultsStateModel
}) {
  return (
    <div className="mt-7 flex gap-4 bg-muted px-5 py-7">
      <MessageSquareText
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
      />
      <div>
        <h3 className="text-lg md:text-xl font-normal text-foreground">
          {model.title}
        </h3>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
      </div>
    </div>
  )
}

export function ProductReviewsLoadErrorStateView({
  model,
  onRetry,
}: {
  model: ProductReviewsLoadErrorStateModel
  onRetry: () => void
}) {
  return (
    <div className="mt-7 flex gap-3 border border-border bg-muted px-5 py-6">
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
      />
      <div>
        <h3 className="text-lg md:text-xl font-normal text-foreground">
          {model.title}
        </h3>
        <p className="mt-1 text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
        <Button
          className="mt-4"
          onClick={onRetry}
          size="sm"
          variant="secondary"
        >
          {model.retryLabel}
        </Button>
      </div>
    </div>
  )
}
