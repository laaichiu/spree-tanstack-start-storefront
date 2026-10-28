import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'
import { useAccountSession } from '@/lib/account/client/account-session-provider'
import { useMarket } from '@/components/layout/market-provider'
import { useProductReviewForm } from '@/lib/reviews/client/use-product-review-form'
import { useEffect } from 'react'

import { ProductReviewFormView } from './product-review-form-view'

import { ProductReviewQuestionFields } from './product-review-question-fields'
import { ReviewMediaPicker } from './review-media-picker'
import { useProductReviewFormSubmission } from '@/lib/reviews/client/use-product-review-form-submission'

function eligibilityMessage(
  reason: string | null,
  t: ReturnType<typeof useMarket>['t'],
) {
  if (reason === 'already_reviewed') {
    return t('reviews.alreadyReviewed')
  }

  if (reason === 'login_required') {
    return t('reviews.loginRequired')
  }

  return t('reviews.notPurchased')
}

export function ProductReviewForm({
  item,
  onCancel,
  onSubmitted,
  onSessionRequired,
  orderId,
}: {
  item: {
    name: string
    productId: string
    variantId: string
  }
  onCancel: () => void
  onSubmitted: () => void
  onSessionRequired: () => void | Promise<void>
  orderId: string
}) {
  const customer = useAccountSession()
  const { market, t } = useMarket()
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const formQuery = useProductReviewForm({
    customerId: customer.id,
    item,
    market: marketInput,
    orderId,
  })
  const sessionRequired =
    formQuery.isError && isCustomerSessionRequiredError(formQuery.error)

  useEffect(() => {
    if (sessionRequired) {
      try {
        void Promise.resolve(onSessionRequired()).catch(() => undefined)
      } catch {
        // A failed login redirect must not create an unhandled form-load rejection.
      }
    }
  }, [onSessionRequired, sessionRequired])

  const submission = useProductReviewFormSubmission({
    customerId: customer.id,
    item,
    market: marketInput,
    orderId,
    onSubmitted,
    onSessionRequired,
    questions: formQuery.data?.questions ?? [],
    t,
  })

  const labels = {
    bodyLabel: t('reviews.bodyLabel'),
    bodyPlaceholder: t('reviews.bodyPlaceholder'),
    cancel: t('reviews.cancel'),
    eligibilityFailed: t('reviews.eligibilityFailed'),
    loadingForm: t('reviews.loadingForm'),
    ratingLabel: `${t('reviews.rating')} (${t('reviews.required')})`,
    submit: t('reviews.submit'),
    submitting: t('reviews.submitting'),
    submitted: t('reviews.submitted'),
    submittedDescription: t('reviews.submittedDescription'),
    titleLabel: `${t('reviews.titleLabel')} (${t('reviews.required')})`,
  }

  if (formQuery.isPending) {
    return (
      <ProductReviewFormView
        actions={{ cancel: onCancel }}
        model={{ labels, state: { status: 'loading' } }}
      />
    )
  }

  if (formQuery.isError) {
    if (sessionRequired) {
      return null
    }

    return (
      <ProductReviewFormView
        actions={{ cancel: onCancel }}
        model={{ labels, state: { status: 'error' } }}
      />
    )
  }

  if (!formQuery.data.eligibility.canReview) {
    return (
      <ProductReviewFormView
        actions={{ cancel: onCancel }}
        model={{
          labels,
          state: {
            message: eligibilityMessage(formQuery.data.eligibility.reason, t),
            status: 'ineligible',
          },
        }}
      />
    )
  }

  if (submission.submitted) {
    return (
      <ProductReviewFormView
        actions={{ cancel: onCancel }}
        model={{ labels, state: { status: 'submitted' } }}
      />
    )
  }

  return (
    <ProductReviewFormView
      actions={{
        bodyChange: submission.onBodyChange,
        cancel: onCancel,
        ratingChange: submission.onRatingChange,
        submit: submission.submitReview,
        titleChange: submission.onTitleChange,
      }}
      model={{
        labels,
        state: {
          body: submission.body,
          error: submission.error,
          rating: submission.rating,
          status: 'ready',
          submitting: submission.submitting,
          title: submission.title,
        },
      }}
      slots={{
        mediaPicker: (
          <ReviewMediaPicker
            files={submission.files}
            onChange={submission.onFilesChange}
            onError={submission.onFileError}
          />
        ),
        questionFields: (
          <ProductReviewQuestionFields
            answers={submission.answers}
            onChange={submission.onAnswerChange}
            questions={formQuery.data.questions}
          />
        ),
      }}
    />
  )
}
