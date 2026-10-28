import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductReviewQuestionFieldsView } from './product-review-question-fields-view'

afterEach(cleanup)

describe('ProductReviewQuestionFieldsView', () => {
  it('forwards selected answers through the direct callback', () => {
    const onChange = vi.fn()

    render(
      <ProductReviewQuestionFieldsView
        model={{
          answers: {},
          labels: {
            no: 'No',
            required: 'Required',
            selectPlaceholder: 'Choose one',
            yes: 'Yes',
          },
          questions: [
            {
              id: 'question-material',
              key: 'material',
              kind: 'boolean',
              label: 'Made with natural materials',
              options: [],
              required: false,
            },
          ],
        }}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Made with natural materials'), {
      target: { value: 'true' },
    })

    expect(onChange).toHaveBeenCalledWith('material', ['true'])
  })
})
