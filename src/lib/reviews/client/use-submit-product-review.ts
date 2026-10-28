import { useServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'

import type { MarketSelectionInput } from '@/lib/core/market'
import { normalizeProductReviewAnswers } from '@/lib/reviews/contracts'
import type {
  ProductReview,
  ProductReviewRating,
} from '@/lib/reviews/contracts'

import {
  createProductReviewMediaUpload,
  submitCustomerProductReview,
} from '../api/customer-reviews.functions'
import { md5Base64 } from './md5'
import { uploadReviewMediaFile } from './upload-review-media'
import {
  getProductReviewSessionGeneration,
  useProductReviewSessionGeneration,
} from './review-query'

const pendingProductReviewSubmissions = new Map<
  string,
  Promise<ProductReview>
>()

function getProductReviewSubmissionKey({
  customerId,
  item,
  market,
  orderId,
}: {
  customerId: string
  item: { productId: string; variantId: string }
  market: MarketSelectionInput
  orderId: string
}) {
  return JSON.stringify([
    customerId,
    orderId,
    item.productId,
    item.variantId,
    market.country,
    market.locale,
  ])
}

export function useSubmitProductReview({
  customerId,
  item,
  market,
  orderId,
}: {
  customerId: string
  item: { productId: string; variantId: string }
  market: MarketSelectionInput
  orderId: string
}) {
  const createProductReviewMediaUploadFn = useServerFn(
    createProductReviewMediaUpload,
  )
  const submitCustomerProductReviewFn = useServerFn(submitCustomerProductReview)
  const sessionGeneration = useProductReviewSessionGeneration()
  const submissionKey = getProductReviewSubmissionKey({
    customerId,
    item,
    market,
    orderId,
  })
  const contextKey = JSON.stringify([sessionGeneration, submissionKey])
  const contextRef = useRef({ key: contextKey, generation: 0 })
  if (contextRef.current.key !== contextKey) {
    contextRef.current = {
      key: contextKey,
      generation: contextRef.current.generation + 1,
    }
  }
  const contextOwner = contextRef.current
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  const [pendingOwner, setPendingOwner] = useState<typeof contextOwner | null>(
    null,
  )
  const submitting = pendingOwner === contextOwner
  const marketInput = {
    country: market.country,
    locale: market.locale,
  }

  async function submit({
    answers,
    body,
    files,
    rating,
    title,
  }: {
    answers: Record<string, string[]>
    body: string
    files: File[]
    rating: number
    title: string
  }) {
    function assertSubmissionOwner() {
      if (
        !isMountedRef.current ||
        contextRef.current !== contextOwner ||
        sessionGeneration !== getProductReviewSessionGeneration()
      ) {
        throw new Error('The review submission owner has changed.')
      }
    }

    assertSubmissionOwner()
    setPendingOwner(contextOwner)

    const pendingSubmission = pendingProductReviewSubmissions.get(contextKey)

    if (pendingSubmission) {
      try {
        const review = await pendingSubmission
        assertSubmissionOwner()
        return review
      } finally {
        if (isMountedRef.current) {
          setPendingOwner((owner) => (owner === contextOwner ? null : owner))
        }
      }
    }

    const submission = submitProductReview({
      answers,
      body,
      files,
      rating,
      title,
      assertSubmissionOwner,
    })
    pendingProductReviewSubmissions.set(contextKey, submission)

    try {
      const review = await submission
      assertSubmissionOwner()
      return review
    } finally {
      if (pendingProductReviewSubmissions.get(contextKey) === submission) {
        pendingProductReviewSubmissions.delete(contextKey)
      }
      if (isMountedRef.current) {
        setPendingOwner((owner) => (owner === contextOwner ? null : owner))
      }
    }
  }

  async function submitProductReview({
    answers,
    body,
    files,
    rating,
    title,
    assertSubmissionOwner,
  }: {
    answers: Record<string, string[]>
    body: string
    files: File[]
    rating: number
    title: string
    assertSubmissionOwner: () => void
  }) {
    const uploadController = new AbortController()
    const uploadErrors: unknown[] = []
    const mediaResults = await Promise.allSettled(
      files.map(async (file) => {
        try {
          const bytes = new Uint8Array(await file.arrayBuffer())
          assertSubmissionOwner()
          const upload = await createProductReviewMediaUploadFn({
            data: {
              byteSize: file.size,
              checksum: md5Base64(bytes),
              contentType: file.type,
              filename: file.name,
              market: marketInput,
            },
          })

          assertSubmissionOwner()
          await uploadReviewMediaFile(upload, file, {
            signal: uploadController.signal,
          })

          return {
            alt: file.name,
            signedId: upload.signedId,
          }
        } catch (error) {
          uploadErrors.push(error)
          uploadController.abort()
          throw error
        }
      }),
    )

    if (uploadErrors.length > 0) {
      throw uploadErrors[0]
    }

    const media = mediaResults.map((result) => {
      if (result.status === 'rejected') {
        throw result.reason
      }

      return result.value
    })

    assertSubmissionOwner()
    return submitCustomerProductReviewFn({
      data: {
        answers: normalizeProductReviewAnswers(answers),
        body,
        market: marketInput,
        media,
        orderId,
        productId: item.productId,
        rating: rating as ProductReviewRating,
        title,
        variantId: item.variantId,
      },
    })
  }

  return { submit, submitting }
}
