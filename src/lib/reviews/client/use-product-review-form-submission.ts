import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { isCustomerSessionRequiredError } from '@/lib/account/utils/customer-session-error'
import type { ProductReviewQuestion } from '@/lib/reviews/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import { useSubmitProductReview } from '@/lib/reviews/client/use-submit-product-review'
import {
  getProductReviewSessionGeneration,
  useProductReviewSessionGeneration,
} from '@/lib/reviews/client/review-query'
import { validateProductReviewForm } from '@/lib/reviews/validation/product-review-form'

type ProductReviewFormItem = {
  name: string
  productId: string
  variantId: string
}

type ProductReviewFormSubmissionOptions = {
  customerId: string
  item: ProductReviewFormItem
  market: {
    country: string
    locale: string
  }
  onSubmitted: () => void
  onSessionRequired: () => void | Promise<void>
  orderId: string
  questions: readonly ProductReviewQuestion[]
  t: (key: MessageKey) => string
}

type ProductReviewFormState = {
  answers: Record<string, string[]>
  body: string
  error: string | null
  files: File[]
  rating: number
  submitted: boolean
  title: string
}

export function useProductReviewFormSubmission({
  customerId,
  item,
  market,
  onSubmitted,
  onSessionRequired,
  orderId,
  questions,
  t,
}: ProductReviewFormSubmissionOptions) {
  const sessionGeneration = useProductReviewSessionGeneration()
  const contextKey = JSON.stringify([
    sessionGeneration,
    customerId,
    market.country,
    market.locale,
    orderId,
    item.productId,
    item.variantId,
  ])
  const contextRef = useRef({ key: contextKey, generation: 0 })
  if (contextRef.current.key !== contextKey) {
    contextRef.current = {
      key: contextKey,
      generation: contextRef.current.generation + 1,
    }
  }
  const contextOwner = contextRef.current
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  const emptyState: ProductReviewFormState = {
    answers: {},
    body: '',
    error: null,
    files: [],
    rating: 0,
    submitted: false,
    title: '',
  }
  const [formState, setFormState] = useState({
    ...emptyState,
    owner: contextOwner,
  })
  const { answers, body, error, files, rating, submitted, title } =
    formState.owner === contextOwner ? formState : emptyState

  function isCurrentOwner() {
    return (
      isMountedRef.current &&
      contextRef.current === contextOwner &&
      sessionGeneration === getProductReviewSessionGeneration()
    )
  }

  function updateForm(patch: Partial<typeof emptyState>) {
    if (!isCurrentOwner()) return
    setFormState((current) => ({
      ...(current.owner === contextOwner ? current : emptyState),
      ...patch,
      owner: contextOwner,
    }))
  }

  const submissionInFlightRef = useRef<typeof contextOwner | null>(null)
  const reviewSubmission = useSubmitProductReview({
    customerId,
    item,
    market,
    orderId,
  })

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isCurrentOwner() || submissionInFlightRef.current === contextOwner) {
      return
    }

    updateForm({ error: null })

    const validationError = validateProductReviewForm({
      answers,
      questions,
      rating,
      title,
    })

    if (validationError?.field === 'rating') {
      updateForm({ error: `${t('reviews.rating')}: ${t('reviews.required')}` })
      return
    }

    if (validationError?.field === 'title') {
      updateForm({
        error: `${t('reviews.titleLabel')}: ${t('reviews.required')}`,
      })
      return
    }

    if (validationError?.field === 'question') {
      updateForm({
        error: `${validationError.question.label}: ${t('reviews.required')}`,
      })
      return
    }

    submissionInFlightRef.current = contextOwner

    try {
      await reviewSubmission.submit({
        answers,
        body,
        files,
        rating,
        title,
      })
      if (!isCurrentOwner()) return
      updateForm({ submitted: true })
      try {
        await onSubmitted()
      } catch {
        // Review submission has already succeeded; parent refresh failures do not undo it.
      }
    } catch (submissionError) {
      if (!isCurrentOwner()) return
      if (isCustomerSessionRequiredError(submissionError)) {
        try {
          await onSessionRequired()
        } catch {
          // A failed login redirect is separate from the review request failure.
        }
        return
      }

      updateForm({ error: t('reviews.submitFailed') })
    } finally {
      if (submissionInFlightRef.current === contextOwner) {
        submissionInFlightRef.current = null
      }
    }
  }

  function updateAnswer(key: string, values: string[]) {
    if (!isCurrentOwner()) return
    setFormState((current) => {
      const state = current.owner === contextOwner ? current : emptyState
      return {
        ...state,
        answers: { ...state.answers, [key]: values },
        owner: contextOwner,
      }
    })
  }

  return {
    answers,
    body,
    error,
    files,
    onAnswerChange: updateAnswer,
    onBodyChange: (value: string) => updateForm({ body: value }),
    onFileError: (value: string | null) => updateForm({ error: value }),
    onFilesChange: (value: File[]) => updateForm({ files: value }),
    onRatingChange: (value: number) => updateForm({ rating: value }),
    onTitleChange: (value: string) => updateForm({ title: value }),
    rating,
    submitted,
    submitting: reviewSubmission.submitting,
    submitReview,
    title,
  }
}
