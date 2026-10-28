import { findMissingRequiredReviewQuestion } from '@/lib/reviews/contracts'
import type { ProductReviewQuestion } from '@/lib/reviews/contracts'

export type ProductReviewFormValidationError =
  | { code: 'required'; field: 'rating' }
  | { code: 'required'; field: 'title' }
  | {
      code: 'required'
      field: 'question'
      question: ProductReviewQuestion
    }

export function validateProductReviewForm({
  answers,
  questions,
  rating,
  title,
}: {
  answers: Readonly<Record<string, readonly string[]>>
  questions: readonly ProductReviewQuestion[]
  rating: number
  title: string
}): ProductReviewFormValidationError | null {
  if (rating < 1) {
    return { code: 'required', field: 'rating' }
  }

  if (!title.trim()) {
    return { code: 'required', field: 'title' }
  }

  const question = findMissingRequiredReviewQuestion(questions, answers)

  return question ? { code: 'required', field: 'question', question } : null
}
