import type { ProductReviewQuestionDisplay } from '@/components/reviews/product-review-question-model'

export type ProductReviewQuestionFieldsModel = {
  answers: Readonly<Record<string, readonly string[]>>
  labels: {
    no: string
    required: string
    selectPlaceholder: string
    yes: string
  }
  questions: readonly ProductReviewQuestionDisplay[]
}
