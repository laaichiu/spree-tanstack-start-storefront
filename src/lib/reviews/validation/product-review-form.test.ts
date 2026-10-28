// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { validateProductReviewForm } from './product-review-form'

const requiredTextQuestion = {
  filterable: false,
  id: 'revq_fit',
  key: 'fit',
  kind: 'text' as const,
  label: 'Fit',
  options: [],
  required: true,
}

describe('product review form validation', () => {
  it('treats whitespace-only required text answers as missing', () => {
    expect(
      validateProductReviewForm({
        answers: { fit: ['   '] },
        questions: [requiredTextQuestion],
        rating: 5,
        title: 'Great shirt',
      }),
    ).toEqual({
      code: 'required',
      field: 'question',
      question: requiredTextQuestion,
    })
  })

  it('accepts a required text answer with non-whitespace content', () => {
    expect(
      validateProductReviewForm({
        answers: { fit: [' comfortable '] },
        questions: [requiredTextQuestion],
        rating: 5,
        title: 'Great shirt',
      }),
    ).toBeNull()
  })
})
