import type {
  ProductReviewAnswer,
  ProductReviewQuestion,
} from './product-review'

const DEFAULT_REVIEW_ANSWER_LIMIT = 6

export type ProductReviewAnswerDisplay = {
  id: string
  questionLabel: string
  value: string
}

export function getVisibleReviewAnswers(
  answers: readonly ProductReviewAnswer[],
  limit = DEFAULT_REVIEW_ANSWER_LIMIT,
) {
  return answers
    .filter((answer) => answer.label !== null || answer.value !== null)
    .slice(0, limit)
}

export function getReviewAnswerValue(answer: ProductReviewAnswer) {
  return String(answer.label ?? answer.value ?? '-')
}

export function getReviewAnswerDisplays(
  answers: readonly ProductReviewAnswer[],
  limit = DEFAULT_REVIEW_ANSWER_LIMIT,
): ProductReviewAnswerDisplay[] {
  return getVisibleReviewAnswers(answers, limit).map((answer) => ({
    id: answer.id,
    questionLabel: answer.questionLabel,
    value: getReviewAnswerValue(answer),
  }))
}

export function findMissingRequiredReviewQuestion(
  questions: readonly ProductReviewQuestion[],
  answers: Readonly<Record<string, readonly string[]>>,
) {
  return questions.find(
    (question) =>
      question.required &&
      !(answers[question.key] ?? []).some((value) => Boolean(value.trim())),
  )
}
