import { Check, ThumbsDown, ThumbsUp } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { formatDate, formatNumber } from '@/lib/i18n/messages'
import type {
  ProductReview,
  ProductReviewMedia,
  ProductReviewVote,
} from '@/lib/reviews/model/product-review'

import { ReviewStars } from './review-stars'

function answerValue(answer: ProductReview['answers'][number]) {
  return answer.label ?? answer.value ?? '-'
}

export function ProductReviewCard({
  failedVote,
  onMediaClick,
  onVote,
  pendingVote,
  review,
}: {
  failedVote: boolean
  onMediaClick: (review: ProductReview, media: ProductReviewMedia) => void
  onVote: (vote: ProductReviewVote) => void
  pendingVote: boolean
  review: ProductReview
}) {
  const { market, t } = useMarket()
  const purchasedOptions = review.purchasedOptionValues.join(' / ')
  const visibleAnswers = review.answers.filter(
    (answer) => answer.label !== null || answer.value !== null,
  )

  return (
    <article className="grid gap-8 border-t border-border pt-8 md:grid-cols-[10rem_minmax(0,1fr)_6rem]">
      <aside className="space-y-5 text-lg text-foreground">
        <div className="space-y-2">
          <p>{review.reviewerName ?? t('reviews.anonymous')}</p>
          {review.verifiedPurchase ? (
            <p className="inline-flex items-center gap-2 text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
              </span>
              {t('reviews.verifiedBuyer')}
            </p>
          ) : null}
          {review.verifiedPurchase && purchasedOptions ? (
            <p className="leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">
                {t('reviews.purchasedOptions')}:
              </span>{' '}
              {purchasedOptions}
            </p>
          ) : null}
        </div>

        {visibleAnswers.length ? (
          <dl className="space-y-4">
            {visibleAnswers.slice(0, 6).map((answer) => (
              <div key={answer.id}>
                <dt className="font-semibold text-foreground">
                  {answer.questionLabel}
                </dt>
                <dd className="mt-1 text-muted-foreground">
                  {String(answerValue(answer))}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </aside>

      <div className="space-y-5">
        <ReviewStars
          className="gap-0.5 [&>svg]:h-5 [&>svg]:w-5"
          label={`${review.rating} / 5`}
          rating={review.rating}
        />

        {review.title ? (
          <h3 className="text-lg font-normal text-foreground">
            {review.title}
          </h3>
        ) : null}

        {review.body ? (
          <p className="max-w-3xl whitespace-pre-line text-lg leading-6 text-foreground">
            {review.body}
          </p>
        ) : null}

        {review.media.some((media) => media.url) ? (
          <div className="flex flex-wrap gap-3">
            {review.media.flatMap((media) =>
              media.url
                ? [
                    <button
                      aria-label={t('reviews.openPhoto')}
                      className="block h-20 w-20 overflow-hidden border border-border bg-muted transition-colors hover:border-foreground focus-visible:focus-ring"
                      key={media.id}
                      onClick={() => onMediaClick(review, media)}
                      type="button"
                    >
                      <img
                        alt={media.alt ?? t('reviews.customerPhoto')}
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

      <footer className="flex items-start justify-between gap-4 text-sm text-muted-foreground md:flex-col md:items-end md:justify-between md:text-right">
        {review.createdAt ? (
          <time dateTime={review.createdAt}>
            {formatDate(review.createdAt, market.locale)}
          </time>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-foreground md:justify-end">
            <button
              aria-label={`${t('reviews.helpful')} (${formatNumber(review.helpfulCount, market.locale)})`}
              aria-pressed={review.currentVote === 'helpful'}
              className="inline-flex items-center gap-1 transition-colors hover:text-muted-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:text-muted-foreground"
              disabled={pendingVote}
              onClick={() => onVote('helpful')}
              type="button"
            >
              <ThumbsUp
                aria-hidden="true"
                className="h-4 w-4"
                fill={
                  review.currentVote === 'helpful' ? 'currentColor' : 'none'
                }
              />
              {formatNumber(review.helpfulCount, market.locale)}
            </button>
            <button
              aria-label={`${t('reviews.notHelpful')} (${formatNumber(review.notHelpfulCount, market.locale)})`}
              aria-pressed={review.currentVote === 'not_helpful'}
              className="inline-flex items-center gap-1 transition-colors hover:text-muted-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:text-muted-foreground"
              disabled={pendingVote}
              onClick={() => onVote('not_helpful')}
              type="button"
            >
              <ThumbsDown
                aria-hidden="true"
                className="h-4 w-4"
                fill={
                  review.currentVote === 'not_helpful' ? 'currentColor' : 'none'
                }
              />
              {formatNumber(review.notHelpfulCount, market.locale)}
            </button>
          </div>
          {failedVote ? (
            <p className="text-sm text-destructive" role="alert">
              {t('reviews.voteFailed')}
            </p>
          ) : null}
        </div>
      </footer>
    </article>
  )
}
