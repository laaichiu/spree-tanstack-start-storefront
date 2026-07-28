import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { CheckCircle, Star } from 'lucide-react'
import { useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getCustomerProductReviewForm } from '@/lib/reviews/api/customer-reviews.functions'
import type { ProductReviewQuestion } from '@/lib/reviews/model/product-review'
import { cn } from '@/lib/utils'

import { ProductReviewQuestionFields } from './product-review-question-fields'
import { ReviewMediaPicker } from './review-media-picker'
import { useSubmitProductReview } from './use-submit-product-review'

function missingRequiredQuestion(
  questions: ProductReviewQuestion[],
  answers: Record<string, string[]>,
) {
  return questions.find(
    (question) =>
      question.required && !(answers[question.key] ?? []).some(Boolean),
  )
}

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
  orderId,
}: {
  item: {
    name: string
    productId: string
    variantId: string
  }
  onCancel: () => void
  onSubmitted: () => void
  orderId: string
}) {
  const { market, t } = useMarket()
  const getCustomerProductReviewFormFn = useServerFn(
    getCustomerProductReviewForm,
  )
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }
  const formQuery = useQuery({
    queryFn: () =>
      getCustomerProductReviewFormFn({
        data: {
          market: marketInput,
          orderId,
          productId: item.productId,
          variantId: item.variantId,
        },
      }),
    queryKey: [
      'product-review-form',
      market.country,
      market.locale,
      orderId,
      item.productId,
      item.variantId,
    ],
    staleTime: 30_000,
  })
  const reviewSubmission = useSubmitProductReview({ item, orderId })

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const requiredQuestion = missingRequiredQuestion(
      formQuery.data?.questions ?? [],
      answers,
    )

    if (rating < 1) {
      setError(`${t('reviews.rating')}: ${t('reviews.required')}`)
      return
    }

    if (!title.trim()) {
      setError(`${t('reviews.titleLabel')}: ${t('reviews.required')}`)
      return
    }

    if (requiredQuestion) {
      setError(`${requiredQuestion.label}: ${t('reviews.required')}`)
      return
    }

    try {
      await reviewSubmission.submit({
        answers,
        body,
        files,
        rating,
        title,
      })
      setSubmitted(true)
      onSubmitted()
    } catch {
      setError(t('reviews.submitFailed'))
    }
  }

  if (formQuery.isPending) {
    return (
      <p className="py-4 text-sm text-muted-foreground" role="status">
        {t('reviews.loadingForm')}
      </p>
    )
  }

  if (formQuery.isError) {
    return (
      <p className="py-4 text-sm text-destructive" role="alert">
        {t('reviews.eligibilityFailed')}
      </p>
    )
  }

  if (!formQuery.data.eligibility.canReview) {
    return (
      <div className="flex items-center justify-between gap-4 py-4">
        <p className="text-sm text-muted-foreground">
          {eligibilityMessage(formQuery.data.eligibility.reason, t)}
        </p>
        <Button onClick={onCancel} size="sm" variant="ghost">
          {t('reviews.cancel')}
        </Button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div
        className="flex gap-3 py-4 text-sm text-muted-foreground"
        role="status"
      >
        <CheckCircle
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
        />
        <div>
          <p className="font-normal text-foreground">
            {t('reviews.submitted')}
          </p>
          <p className="mt-1 leading-6">{t('reviews.submittedDescription')}</p>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-6 pt-5" onSubmit={submitReview}>
      <div>
        <p className="text-sm leading-4 font-normal uppercase text-foreground">
          {t('reviews.rating')} ({t('reviews.required')})
        </p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-label={`${value} / 5`}
              aria-pressed={rating === value}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-foreground outline-none focus-visible:focus-ring"
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              <Star
                aria-hidden="true"
                className={cn(
                  'h-5 w-5',
                  value <= rating ? 'fill-foreground' : 'fill-transparent',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        label={`${t('reviews.titleLabel')} (${t('reviews.required')})`}
        maxLength={120}
        onChange={(event) => setTitle(event.currentTarget.value)}
        value={title}
      />

      <label className="block">
        <span className="mb-2 block text-sm leading-4 font-normal uppercase text-foreground">
          {t('reviews.bodyLabel')}
        </span>
        <textarea
          className="min-h-32 w-full resize-y rounded-sm border border-input bg-background px-3 py-3 text-lg leading-6 text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:focus-ring"
          maxLength={10_000}
          onChange={(event) => setBody(event.currentTarget.value)}
          placeholder={t('reviews.bodyPlaceholder')}
          value={body}
        />
      </label>

      <ProductReviewQuestionFields
        answers={answers}
        onChange={(key, values) =>
          setAnswers((current) => ({ ...current, [key]: values }))
        }
        questions={formQuery.data.questions}
      />

      <ReviewMediaPicker files={files} onChange={setFiles} onError={setError} />

      {error ? (
        <p className="text-sm leading-6 text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button disabled={reviewSubmission.submitting} type="submit">
          {reviewSubmission.submitting
            ? t('reviews.submitting')
            : t('reviews.submit')}
        </Button>
        <Button
          disabled={reviewSubmission.submitting}
          onClick={onCancel}
          type="button"
          variant="secondary"
        >
          {t('reviews.cancel')}
        </Button>
      </div>
    </form>
  )
}
