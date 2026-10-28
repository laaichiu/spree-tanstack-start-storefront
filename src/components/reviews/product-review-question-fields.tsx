import { useMarket } from '@/components/layout/market-provider'
import type { ProductReviewQuestion } from '@/lib/reviews/contracts'
import { getProductReviewQuestionDisplays } from './product-review-question-model'

import { ProductReviewQuestionFieldsView } from './product-review-question-fields-view'

export function ProductReviewQuestionFields({
  answers,
  onChange,
  questions,
}: {
  answers: Record<string, string[]>
  onChange: (key: string, values: string[]) => void
  questions: ProductReviewQuestion[]
}) {
  const { t } = useMarket()

  return (
    <ProductReviewQuestionFieldsView
      model={{
        answers,
        labels: {
          no: t('reviews.no'),
          required: t('reviews.required'),
          selectPlaceholder: t('reviews.selectPlaceholder'),
          yes: t('reviews.yes'),
        },
        questions: getProductReviewQuestionDisplays(questions),
      }}
      onChange={onChange}
    />
  )
}
