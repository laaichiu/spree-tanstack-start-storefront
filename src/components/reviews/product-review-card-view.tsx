import { Check, ThumbsDown, ThumbsUp } from 'lucide-react'

import type { ProductReviewCardProps } from '../contracts/reviews'
import { ReviewStarsView } from './review-stars-view'

export type {
  ProductReviewCardActions,
  ProductReviewCardModel,
  ProductReviewCardProps,
  ProductReviewCardMedia,
  ProductReviewVoteAction,
} from '../contracts/reviews'

export function ProductReviewCardView({
  actions,
  model,
}: ProductReviewCardProps) {
  const {
    createdAtLabel,
    failedVote,
    helpfulCountLabel,
    labels,
    notHelpfulCountLabel,
    pendingVote,
    review,
  } = model
  const purchasedOptions = review.purchasedOptionValues.join(' / ')

  return (
    <article className="grid gap-8 border-t border-border pt-8 md:grid-cols-[10rem_minmax(0,1fr)_6rem]">
      <aside className="space-y-5 text-xs text-foreground">
        <div className="space-y-2">
          <p>{review.reviewerName ?? labels.anonymous}</p>
          {review.verifiedPurchase ? (
            <p className="inline-flex items-center gap-2 text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
              </span>
              {labels.verifiedBuyer}
            </p>
          ) : null}
          {review.verifiedPurchase && purchasedOptions ? (
            <p className="leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">
                {labels.purchasedOptions}:
              </span>{' '}
              {purchasedOptions}
            </p>
          ) : null}
        </div>

        {review.answers.length ? (
          <dl className="space-y-4">
            {review.answers.map((answer) => (
              <div key={answer.id}>
                <dt className="font-semibold text-foreground">
                  {answer.questionLabel}
                </dt>
                <dd className="mt-1 text-muted-foreground">{answer.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </aside>

      <div className="space-y-5">
        <ReviewStarsView
          className="gap-0.5 [&>svg]:h-5 [&>svg]:w-5"
          label={`${review.rating} / 5`}
          rating={review.rating}
        />

        {review.title ? (
          <h3 className="text-xs font-normal text-foreground">
            {review.title}
          </h3>
        ) : null}

        {review.body ? (
          <p className="max-w-3xl whitespace-pre-line text-xs leading-6 text-foreground">
            {review.body}
          </p>
        ) : null}

        {review.media.some((media) => media.url) ? (
          <div className="flex flex-wrap gap-3">
            {review.media.flatMap((media) =>
              media.url
                ? [
                    <button
                      aria-label={labels.openPhoto}
                      className="block h-20 w-20 overflow-hidden border border-border bg-muted transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      key={media.id}
                      onClick={() => actions.mediaClick(media)}
                      type="button"
                    >
                      <img
                        alt={media.alt ?? labels.customerPhoto}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        src={media.url}
                      />
                    </button>,
                  ]
                : [],
            )}
          </div>
        ) : null}
      </div>

      <footer className="flex items-start justify-between gap-4 text-xs text-muted-foreground md:flex-col md:items-end md:justify-between md:text-right">
        {createdAtLabel ? (
          <time dateTime={review.createdAt}>{createdAtLabel}</time>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-foreground md:justify-end">
            <button
              aria-label={`${labels.helpful} (${helpfulCountLabel})`}
              aria-pressed={review.currentVote === 'helpful'}
              className="inline-flex items-center gap-1 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:text-muted-foreground"
              disabled={pendingVote}
              onClick={() => actions.vote('helpful')}
              type="button"
            >
              <ThumbsUp
                aria-hidden="true"
                className="h-4 w-4"
                fill={
                  review.currentVote === 'helpful' ? 'currentColor' : 'none'
                }
              />
              {helpfulCountLabel}
            </button>
            <button
              aria-label={`${labels.notHelpful} (${notHelpfulCountLabel})`}
              aria-pressed={review.currentVote === 'not_helpful'}
              className="inline-flex items-center gap-1 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:text-muted-foreground"
              disabled={pendingVote}
              onClick={() => actions.vote('not_helpful')}
              type="button"
            >
              <ThumbsDown
                aria-hidden="true"
                className="h-4 w-4"
                fill={
                  review.currentVote === 'not_helpful' ? 'currentColor' : 'none'
                }
              />
              {notHelpfulCountLabel}
            </button>
          </div>
          {failedVote ? (
            <p className="text-xs text-destructive" role="alert">
              {labels.voteFailed}
            </p>
          ) : null}
        </div>
      </footer>
    </article>
  )
}
