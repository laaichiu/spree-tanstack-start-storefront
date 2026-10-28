import type {
  ProductReviewQuestion,
  ProductReviewQuestionOption,
} from '@/lib/reviews/contracts'

export type ProductReviewQuestionOptionDisplay = Pick<
  ProductReviewQuestionOption,
  'id' | 'label' | 'value'
>

export type ProductReviewQuestionDisplay = Pick<
  ProductReviewQuestion,
  'id' | 'key' | 'kind' | 'label' | 'required'
> & {
  options: ProductReviewQuestionOptionDisplay[]
}

export function getProductReviewQuestionDisplays(
  questions: readonly ProductReviewQuestion[],
): ProductReviewQuestionDisplay[] {
  return questions.map((question) => ({
    id: question.id,
    key: question.key,
    kind: question.kind,
    label: question.label,
    options: question.options.map(({ id, label, value }) => ({
      id,
      label,
      value,
    })),
    required: question.required,
  }))
}
