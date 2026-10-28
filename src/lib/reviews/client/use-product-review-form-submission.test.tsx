import { act, cleanup, renderHook } from '@testing-library/react'
import type { FormEvent } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CUSTOMER_SESSION_REQUIRED_ERROR_CODE } from '@/lib/account/utils/customer-session-error'
import type { MessageKey } from '@/lib/i18n/messages'

import { useProductReviewFormSubmission } from './use-product-review-form-submission'

const reviewSubmission = vi.hoisted(() => ({
  submit: vi.fn(),
  submitting: false,
}))

vi.mock('@/lib/reviews/client/use-submit-product-review', () => ({
  useSubmitProductReview: () => reviewSubmission,
}))

const market = { country: 'us', locale: 'en' }
const item = {
  name: 'Linen shirt',
  productId: 'prod_shirt',
  variantId: 'variant_shirt',
}

function createHarness(
  onSessionRequired: () => void | Promise<void>,
  onSubmitted = vi.fn(),
  customerId = 'cust_customer',
) {
  return renderHook(() =>
    useProductReviewFormSubmission({
      customerId,
      item,
      market,
      onSessionRequired,
      onSubmitted,
      orderId: 'or_123',
      questions: [],
      t: (key: MessageKey) => key,
    }),
  )
}

async function submitValidForm(result: {
  current: ReturnType<typeof useProductReviewFormSubmission>
}) {
  act(() => {
    result.current.onRatingChange(5)
    result.current.onTitleChange('Great shirt')
  })

  await act(async () => {
    await result.current.submitReview({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  reviewSubmission.submitting = false
})

afterEach(cleanup)

describe('useProductReviewFormSubmission customer session boundary', () => {
  it('ignores a duplicate submit while the first request is in flight', async () => {
    let resolveSubmission: () => void = () => undefined
    reviewSubmission.submit.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSubmission = resolve
      }),
    )
    const onSubmitted = vi.fn()
    const { result } = createHarness(vi.fn(), onSubmitted)

    act(() => {
      result.current.onRatingChange(5)
      result.current.onTitleChange('Great shirt')
    })

    let firstSubmit: Promise<void> | undefined
    let secondSubmit: Promise<void> | undefined
    act(() => {
      firstSubmit = result.current.submitReview({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
      secondSubmit = result.current.submitReview({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
    })

    expect(reviewSubmission.submit).toHaveBeenCalledOnce()
    expect(onSubmitted).not.toHaveBeenCalled()

    await act(async () => {
      resolveSubmission()
      await firstSubmit
      await secondSubmit
    })

    expect(onSubmitted).toHaveBeenCalledOnce()
  })

  it('redirects and clears the local error path after session expiry', async () => {
    const onSessionRequired = vi.fn().mockResolvedValue(undefined)
    reviewSubmission.submit.mockRejectedValue({
      code: CUSTOMER_SESSION_REQUIRED_ERROR_CODE,
    })
    const { result } = createHarness(onSessionRequired)

    await submitValidForm(result)

    expect(onSessionRequired).toHaveBeenCalledOnce()
    expect(result.current.error).toBeNull()
  })

  it('contains a failed login redirect after session expiry', async () => {
    const onSessionRequired = vi
      .fn()
      .mockRejectedValue(new Error('navigation failed'))
    reviewSubmission.submit.mockRejectedValue({
      code: CUSTOMER_SESSION_REQUIRED_ERROR_CODE,
    })
    const { result } = createHarness(onSessionRequired)

    await submitValidForm(result)

    expect(onSessionRequired).toHaveBeenCalledOnce()
    expect(result.current.error).toBeNull()
    expect(result.current.submitted).toBe(false)
  })

  it('keeps a review submitted when the parent callback fails', async () => {
    reviewSubmission.submit.mockResolvedValue({ id: 'rev_review' })
    const onSubmitted = vi
      .fn()
      .mockRejectedValue(new Error('parent refresh failed'))
    const { result } = createHarness(vi.fn(), onSubmitted)

    await submitValidForm(result)

    expect(onSubmitted).toHaveBeenCalledOnce()
    expect(result.current.submitted).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('keeps ordinary submission errors in the review form', async () => {
    const onSessionRequired = vi.fn().mockResolvedValue(undefined)
    reviewSubmission.submit.mockRejectedValue(new Error('network failure'))
    const { result } = createHarness(onSessionRequired)

    await submitValidForm(result)

    expect(onSessionRequired).not.toHaveBeenCalled()
    expect(result.current.error).toBe('reviews.submitFailed')
  })
})

describe('review form stale completions', () => {
  it.each(['success', 'failure', 'unauthorized'] as const)(
    'ignores an old %s response after switching customers',
    async (outcome) => {
      let resolve: (value: unknown) => void = () => undefined
      let reject: (reason: unknown) => void = () => undefined
      reviewSubmission.submit.mockReturnValue(
        new Promise((accept, fail) => {
          resolve = accept
          reject = fail
        }),
      )
      const onSubmitted = vi.fn()
      const onSessionRequired = vi.fn()
      const harness = renderHook(
        ({ customerId }) =>
          useProductReviewFormSubmission({
            customerId,
            item,
            market,
            onSubmitted,
            onSessionRequired,
            orderId: 'or_123',
            questions: [],
            t: (key: MessageKey) => key,
          }),
        { initialProps: { customerId: 'cust_first' } },
      )
      act(() => {
        harness.result.current.onRatingChange(5)
        harness.result.current.onTitleChange('First customer title')
      })
      let pending: Promise<void> | undefined
      act(() => {
        pending = harness.result.current.submitReview({
          preventDefault: vi.fn(),
        } as unknown as FormEvent<HTMLFormElement>)
      })
      harness.rerender({ customerId: 'cust_second' })
      expect(harness.result.current.title).toBe('')
      expect(harness.result.current.rating).toBe(0)
      act(() => {
        harness.result.current.onTitleChange('Second customer title')
      })
      await act(async () => {
        if (outcome === 'success') resolve({ id: 'rev_first' })
        else
          reject(
            outcome === 'unauthorized'
              ? { code: CUSTOMER_SESSION_REQUIRED_ERROR_CODE }
              : new Error('network failed'),
          )
        await pending
      })
      expect(harness.result.current.title).toBe('Second customer title')
      expect(harness.result.current.submitted).toBe(false)
      expect(harness.result.current.error).toBeNull()
      expect(onSubmitted).not.toHaveBeenCalled()
      expect(onSessionRequired).not.toHaveBeenCalled()
    },
  )

  it('ignores a completion after unmounting', async () => {
    let resolve: (value: unknown) => void = () => undefined
    reviewSubmission.submit.mockReturnValue(
      new Promise((accept) => {
        resolve = accept
      }),
    )
    const onSubmitted = vi.fn()
    const harness = createHarness(vi.fn(), onSubmitted)
    act(() => {
      harness.result.current.onRatingChange(5)
      harness.result.current.onTitleChange('Review title')
    })
    let pending: Promise<void> | undefined
    act(() => {
      pending = harness.result.current.submitReview({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
    })
    harness.unmount()
    await act(async () => {
      resolve({ id: 'rev_first' })
      await pending
    })
    expect(onSubmitted).not.toHaveBeenCalled()
  })

  it('does not restore a prior form or invoke its callback after a market round trip', async () => {
    let resolve: (value: unknown) => void = () => undefined
    reviewSubmission.submit.mockReturnValue(
      new Promise((accept) => {
        resolve = accept
      }),
    )
    const onSubmitted = vi.fn()
    const harness = renderHook(
      ({ currentMarket }) =>
        useProductReviewFormSubmission({
          customerId: 'cust_customer',
          item,
          market: currentMarket,
          onSubmitted,
          onSessionRequired: vi.fn(),
          orderId: 'or_123',
          questions: [],
          t: (key: MessageKey) => key,
        }),
      { initialProps: { currentMarket: market } },
    )
    act(() => {
      harness.result.current.onRatingChange(5)
      harness.result.current.onTitleChange('Review title')
    })
    let pending: Promise<void> | undefined
    act(() => {
      pending = harness.result.current.submitReview({
        preventDefault: vi.fn(),
      } as unknown as FormEvent<HTMLFormElement>)
    })
    harness.rerender({ currentMarket: { country: 'de', locale: 'de' } })
    harness.rerender({ currentMarket: market })
    expect(harness.result.current.title).toBe('')
    await act(async () => {
      resolve({ id: 'rev_first' })
      await pending
    })
    expect(harness.result.current.submitted).toBe(false)
    expect(onSubmitted).not.toHaveBeenCalled()
  })
})
