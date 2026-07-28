import { CircleAlert, MessageSquareText } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductReviewQuery,
  ProductReviewsFeatureState,
} from '@/lib/reviews/model/product-review'

import { ProductReviewCard } from './product-review-card'
import { ProductReviewControls } from './product-review-controls'
import { ProductReviewSummaryPanel } from './product-review-summary'
import { PRODUCT_REVIEWS_SECTION_ID } from './product-rating-anchor'
import {
  getReviewMediaItemId,
  getReviewMediaItems,
  ReviewMediaLightbox,
} from './review-media-lightbox'
import { useProductReviews, useProductReviewVote } from './use-product-reviews'

function defaultReviewQuery(
  sort: ProductReviewQuery['sort'],
): ProductReviewQuery {
  return {
    answerFilters: {},
    page: 1,
    ratings: [],
    sort,
    verifiedPurchase: false,
    withImages: false,
  }
}

export function ProductReviewsSection({
  feature,
  productId,
}: {
  feature: ProductReviewsFeatureState
  productId: string
}) {
  const { t } = useMarket()

  if (feature.status === 'unavailable') {
    return (
      <section
        className="mx-auto mt-14 w-full max-w-[78rem] border-t border-border pt-10 lg:mt-20"
        id={PRODUCT_REVIEWS_SECTION_ID}
      >
        <div className="flex gap-3 bg-muted px-5 py-6 text-muted-foreground">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-normal text-foreground">
              {t('reviews.reviewsUnavailable')}
            </h2>
            <p className="mt-1 text-sm leading-6">
              {t('reviews.reviewsUnavailableDescription')}
            </p>
          </div>
        </div>
      </section>
    )
  }

  if (feature.summary.reviewCount === 0) {
    return <ProductReviewsEmptySection />
  }

  return <ProductReviewsReadySection feature={feature} productId={productId} />
}

function ProductReviewsEmptySection() {
  const { t } = useMarket()

  return (
    <section
      className="mx-auto mt-14 w-full max-w-[78rem] scroll-mt-24 lg:mt-20"
      id={PRODUCT_REVIEWS_SECTION_ID}
    >
      <h2 className="text-lg leading-none font-normal tracking-wider text-foreground sm:text-xl">
        {t('reviews.title')}
      </h2>
      <div className="mt-6 bg-muted px-6 py-10 text-sm text-muted-foreground sm:px-8">
        {t('reviews.noReviews')}
      </div>
    </section>
  )
}

function ProductReviewsReadySection({
  feature,
  productId,
}: {
  feature: Extract<ProductReviewsFeatureState, { status: 'ready' }>
  productId: string
}) {
  const { t } = useMarket()
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [query, setQuery] = useState<ProductReviewQuery>(() =>
    defaultReviewQuery(feature.filters.defaultSort),
  )
  const reviewsQuery = useProductReviews({
    defaultSort: feature.filters.defaultSort,
    initialPage: feature.initialPage,
    productId,
    query,
  })
  const reviewVote = useProductReviewVote(productId)
  const page = reviewsQuery.data ?? feature.initialPage
  const pageCount = Math.max(1, page.pagination.pageCount)
  const reviewMediaItems = useMemo(
    () => getReviewMediaItems(page.reviews),
    [page.reviews],
  )

  function updateQuery(nextQuery: ProductReviewQuery) {
    setSelectedMediaId(null)
    setQuery(nextQuery)
  }

  function updatePage(nextPage: number | null) {
    if (!nextPage) {
      return
    }

    setSelectedMediaId(null)
    setQuery((current) => ({ ...current, page: nextPage }))
  }

  return (
    <section
      aria-busy={reviewsQuery.isFetching}
      className="mx-auto mt-14 w-full max-w-[78rem] scroll-mt-24 lg:mt-20"
      id={PRODUCT_REVIEWS_SECTION_ID}
    >
      <div className="flex items-end justify-between gap-5">
        <h2 className="text-lg leading-none font-normal tracking-wider text-foreground sm:text-xl">
          {t('reviews.title')}
        </h2>
        {reviewsQuery.isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            {t('reviews.loading')}
          </p>
        ) : null}
      </div>

      <div className="mt-8">
        <ProductReviewSummaryPanel summary={feature.summary} />
      </div>

      <div className="mt-8">
        <ProductReviewControls
          disabled={reviewsQuery.isFetching}
          filters={feature.filters}
          onChange={updateQuery}
          onClear={() =>
            setQuery((current) => defaultReviewQuery(current.sort))
          }
          query={query}
        />

        {reviewsQuery.isError ? (
          <div className="mt-7 flex gap-3 border border-border bg-muted px-5 py-6">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
            />
            <div>
              <h3 className="font-normal text-foreground">
                {t('reviews.loadFailed')}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t('reviews.loadFailedDescription')}
              </p>
              <Button
                className="mt-4"
                onClick={() => void reviewsQuery.refetch()}
                size="sm"
                variant="secondary"
              >
                {t('reviews.loading')}
              </Button>
            </div>
          </div>
        ) : page.reviews.length ? (
          <div className="mt-8 space-y-8">
            {page.reviews.map((review) => (
              <ProductReviewCard
                failedVote={
                  reviewVote.isError &&
                  reviewVote.variables.reviewId === review.id
                }
                key={review.id}
                onMediaClick={(selectedReview, media) =>
                  setSelectedMediaId(
                    getReviewMediaItemId(selectedReview, media),
                  )
                }
                onVote={(vote) =>
                  reviewVote.mutate({ reviewId: review.id, vote })
                }
                pendingVote={
                  reviewVote.isPending &&
                  reviewVote.variables.reviewId === review.id
                }
                review={review}
              />
            ))}
          </div>
        ) : (
          <div className="mt-7 flex gap-4 bg-muted px-5 py-7">
            <MessageSquareText
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
            />
            <div>
              <h3 className="font-normal text-foreground">
                {t('reviews.noReviews')}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t('reviews.noReviewsDescription')}
              </p>
            </div>
          </div>
        )}

        {page.pagination.pageCount > 1 ? (
          <nav
            aria-label={t('reviews.title')}
            className="mt-8 flex items-center justify-between gap-4"
          >
            <Button
              disabled={
                !page.pagination.previousPage || reviewsQuery.isFetching
              }
              onClick={() => updatePage(page.pagination.previousPage)}
              variant="secondary"
            >
              {t('reviews.previousPage')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('reviews.pageOf')
                .replace('{page}', String(page.pagination.page))
                .replace('{pages}', String(pageCount))}
            </p>
            <Button
              disabled={!page.pagination.nextPage || reviewsQuery.isFetching}
              onClick={() => updatePage(page.pagination.nextPage)}
              variant="secondary"
            >
              {t('reviews.nextPage')}
            </Button>
          </nav>
        ) : null}
      </div>

      <ReviewMediaLightbox
        items={reviewMediaItems}
        onClose={() => setSelectedMediaId(null)}
        onSelectId={setSelectedMediaId}
        selectedId={selectedMediaId}
      />
    </section>
  )
}
