import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CUSTOMER_SESSION_REQUIRED_ERROR_CODE } from '@/lib/account/utils/customer-session-error'

import { ProductReviewForm } from './product-review-form'

const hooks = vi.hoisted(() => ({
  formQuery: {
    data: undefined,
    error: null as Error | { code: string } | null,
    isError: false,
    isPending: false,
  },
  submission: {
    answers: {},
    body: '',
    error: null as string | null,
    files: [] as File[],
    onAnswerChange: vi.fn(),
    onBodyChange: vi.fn(),
    onFileError: vi.fn(),
    onFilesChange: vi.fn(),
    onRatingChange: vi.fn(),
    onTitleChange: vi.fn(),
    rating: 0,
    submitReview: vi.fn(),
    submitted: false,
    submitting: false,
    title: '',
  },
}))

const redirectToLogin = vi.hoisted(() => vi.fn())

vi.mock('@/components/layout/market-provider', () => ({
  useMarket: () => ({
    market: { country: 'us', locale: 'en' },
    t: (key: string) => key,
  }),
}))

vi.mock('@/lib/account/client/account-session-provider', () => ({
  useAccountSession: () => ({ id: 'cust_customer' }),
}))

vi.mock('@/lib/reviews/client/use-product-review-form', () => ({
  useProductReviewForm: () => hooks.formQuery,
}))

vi.mock('@/lib/reviews/client/use-product-review-form-submission', () => ({
  useProductReviewFormSubmission: () => hooks.submission,
}))

const item = {
  name: 'Linen shirt',
  productId: 'prod_shirt',
  variantId: 'variant_shirt',
}

function renderForm() {
  return render(
    <ProductReviewForm
      item={item}
      onCancel={vi.fn()}
      onSessionRequired={redirectToLogin}
      onSubmitted={vi.fn()}
      orderId="or_123"
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  hooks.formQuery.data = undefined
  hooks.formQuery.error = null
  hooks.formQuery.isError = false
  hooks.formQuery.isPending = false
})

afterEach(cleanup)

describe('ProductReviewForm customer session boundary', () => {
  it('redirects instead of showing a generic error after session expiry', async () => {
    hooks.formQuery.error = { code: CUSTOMER_SESSION_REQUIRED_ERROR_CODE }
    hooks.formQuery.isError = true

    renderForm()

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce())

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('contains a failed login redirect after session-expired form load', async () => {
    hooks.formQuery.error = { code: CUSTOMER_SESSION_REQUIRED_ERROR_CODE }
    hooks.formQuery.isError = true
    redirectToLogin.mockRejectedValue(new Error('navigation failed'))

    renderForm()

    await waitFor(() => expect(redirectToLogin).toHaveBeenCalledOnce())

    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('keeps ordinary form-load errors visible without redirecting', () => {
    hooks.formQuery.error = new Error('network failure')
    hooks.formQuery.isError = true

    renderForm()

    expect(screen.getByRole('alert').textContent).toContain(
      'reviews.eligibilityFailed',
    )
    expect(redirectToLogin).not.toHaveBeenCalled()
  })
})
