import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSubmitProductReview } from './use-submit-product-review'

const server = vi.hoisted(() => ({
  createMediaUpload: vi.fn(),
  submitReview: vi.fn(),
}))

const media = vi.hoisted(() => ({
  upload: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: (fn: unknown) =>
    fn === 'create-media' ? server.createMediaUpload : server.submitReview,
}))

vi.mock('../api/customer-reviews.functions', () => ({
  createProductReviewMediaUpload: 'create-media',
  submitCustomerProductReview: 'submit-review',
}))

vi.mock('./upload-review-media', () => ({
  uploadReviewMediaFile: media.upload,
}))

const market = { country: 'us', locale: 'en' }
const item = { productId: 'prod_shirt', variantId: 'variant_shirt' }
const input = {
  answers: {},
  body: 'A useful review.',
  files: [],
  rating: 5,
  title: 'Great shirt',
}

function createHarness(currentMarket = market, customerId = 'cust_customer') {
  return renderHook(() =>
    useSubmitProductReview({
      customerId,
      item,
      market: currentMarket,
      orderId: 'or_order',
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(cleanup)

describe('useSubmitProductReview submission lifecycle', () => {
  it('shares one pending submission across controller remounts', async () => {
    let resolveSubmission: (value: { id: string }) => void = () => undefined
    server.submitReview.mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        resolveSubmission = resolve
      }),
    )
    const first = createHarness()
    const second = createHarness()

    let firstSubmission: Promise<unknown> | undefined
    let secondSubmission: Promise<unknown> | undefined
    act(() => {
      firstSubmission = first.result.current.submit(input)
      secondSubmission = second.result.current.submit(input)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(server.submitReview).toHaveBeenCalledOnce()

    await act(async () => {
      resolveSubmission({ id: 'rev_review' })
      await firstSubmission!
      await secondSubmission!
    })

    expect(first.result.current.submitting).toBe(false)
    expect(second.result.current.submitting).toBe(false)
  })

  it('releases the shared key after failure so a retry can submit', async () => {
    server.submitReview
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({ id: 'rev_review' })
    const first = createHarness()

    await act(async () => {
      await expect(first.result.current.submit(input)).rejects.toThrow(
        'network failure',
      )
    })

    await act(async () => {
      await first.result.current.submit(input)
    })

    expect(server.submitReview).toHaveBeenCalledTimes(2)
  })

  it('does not share a pending submission across markets', async () => {
    let resolveUsSubmission: (value: { id: string }) => void = () => undefined
    let resolveDeSubmission: (value: { id: string }) => void = () => undefined
    server.submitReview
      .mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveUsSubmission = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveDeSubmission = resolve
        }),
      )
    const us = createHarness({ country: 'us', locale: 'en' })
    const de = createHarness({ country: 'de', locale: 'de-DE' })

    let usSubmission: Promise<unknown> | undefined
    let deSubmission: Promise<unknown> | undefined
    act(() => {
      usSubmission = us.result.current.submit(input)
      deSubmission = de.result.current.submit(input)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(server.submitReview).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveUsSubmission({ id: 'rev_us_review' })
      resolveDeSubmission({ id: 'rev_de_review' })
      await usSubmission!
      await deSubmission!
    })
  })

  it('does not share a pending submission across customers', async () => {
    let resolveFirstSubmission: (value: { id: string }) => void = () =>
      undefined
    let resolveSecondSubmission: (value: { id: string }) => void = () =>
      undefined
    server.submitReview
      .mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveFirstSubmission = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveSecondSubmission = resolve
        }),
      )
    const first = createHarness(market, 'cust_first')
    const second = createHarness(market, 'cust_second')

    let firstSubmission: Promise<unknown> | undefined
    let secondSubmission: Promise<unknown> | undefined
    act(() => {
      firstSubmission = first.result.current.submit(input)
      secondSubmission = second.result.current.submit(input)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(server.submitReview).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveFirstSubmission({ id: 'rev_first_customer' })
      resolveSecondSubmission({ id: 'rev_second_customer' })
      await firstSubmission!
      await secondSubmission!
    })
  })

  it('aborts sibling uploads before releasing a failed submission', async () => {
    server.createMediaUpload.mockResolvedValue({
      headers: { 'Content-Type': 'image/jpeg' },
      signedId: 'signed_image',
      url: 'https://uploads.example.test/blob',
    })
    media.upload
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockImplementationOnce(
        (_upload: unknown, _file: unknown, options: { signal: AbortSignal }) =>
          new Promise<never>((_resolve, reject) => {
            if (options.signal.aborted) {
              reject(new Error('sibling upload aborted'))
              return
            }

            options.signal.addEventListener(
              'abort',
              () => reject(new Error('sibling upload aborted')),
              { once: true },
            )
          }),
      )
    const harness = createHarness()

    await act(async () => {
      await expect(
        harness.result.current.submit({
          ...input,
          files: [
            new File(['first'], 'first.jpg', { type: 'image/jpeg' }),
            new File(['second'], 'second.jpg', { type: 'image/jpeg' }),
          ],
        }),
      ).rejects.toThrow('upload failed')
    })

    expect(media.upload).toHaveBeenCalledTimes(2)
    expect(media.upload.mock.calls[1][2].signal.aborted).toBe(true)
    expect(server.submitReview).not.toHaveBeenCalled()
  })
})

describe('review submission owner transitions', () => {
  it.each(['customer', 'market', 'session', 'unmount'] as const)(
    'does not submit after the %s changes during upload',
    async (transition) => {
      let finishUpload: () => void = () => undefined
      server.createMediaUpload.mockResolvedValue({
        headers: {},
        signedId: 'signed_image',
        url: 'https://uploads.example.test/blob',
      })
      media.upload.mockReturnValue(
        new Promise<void>((resolve) => {
          finishUpload = resolve
        }),
      )
      const harness = renderHook(
        ({ customerId, currentMarket }) =>
          useSubmitProductReview({
            customerId,
            market: currentMarket,
            item,
            orderId: 'or_order',
          }),
        { initialProps: { customerId: 'cust_first', currentMarket: market } },
      )
      let submission: Promise<unknown> | undefined
      act(() => {
        submission = harness.result.current.submit({
          ...input,
          files: [new File(['image'], 'image.jpg', { type: 'image/jpeg' })],
        })
      })
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(media.upload).toHaveBeenCalledOnce()

      if (transition === 'unmount') harness.unmount()
      else if (transition === 'session') {
        const { clearProductReviewSessionState } =
          await import('./review-query')
        const { QueryClient } = await import('@tanstack/react-query')
        act(() => clearProductReviewSessionState(new QueryClient()))
      } else
        harness.rerender({
          customerId: transition === 'customer' ? 'cust_second' : 'cust_first',
          currentMarket:
            transition === 'market' ? { country: 'de', locale: 'de' } : market,
        })

      await act(async () => {
        finishUpload()
        await expect(submission).rejects.toThrow('owner has changed')
      })
      expect(server.submitReview).not.toHaveBeenCalled()
    },
  )

  it('does not clear the newer owner pending state when an older submission settles', async () => {
    let resolveFirst: (value: { id: string }) => void = () => undefined
    let resolveSecond: (value: { id: string }) => void = () => undefined
    server.submitReview
      .mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveFirst = resolve
        }),
      )
      .mockReturnValueOnce(
        new Promise<{ id: string }>((resolve) => {
          resolveSecond = resolve
        }),
      )
    const harness = renderHook(
      ({ customerId }) =>
        useSubmitProductReview({
          customerId,
          market,
          item,
          orderId: 'or_order',
        }),
      {
        initialProps: { customerId: 'cust_first' },
      },
    )
    let first: Promise<unknown> | undefined
    let second: Promise<unknown> | undefined
    act(() => {
      first = harness.result.current.submit(input)
    })
    await act(async () => {
      await Promise.resolve()
    })
    harness.rerender({ customerId: 'cust_second' })
    expect(harness.result.current.submitting).toBe(false)
    act(() => {
      second = harness.result.current.submit(input)
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(harness.result.current.submitting).toBe(true)

    await act(async () => {
      resolveFirst({ id: 'rev_first' })
      await expect(first).rejects.toThrow('owner has changed')
    })
    expect(harness.result.current.submitting).toBe(true)
    await act(async () => {
      resolveSecond({ id: 'rev_second' })
      await second
    })
    expect(harness.result.current.submitting).toBe(false)
  })
})
