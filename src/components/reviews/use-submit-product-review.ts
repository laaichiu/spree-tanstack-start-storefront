import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import {
  createProductReviewMediaUpload,
  submitCustomerProductReview,
} from '@/lib/reviews/api/customer-reviews.functions'
import { md5Base64 } from '@/lib/reviews/client/md5'
import { uploadReviewMediaFile } from '@/lib/reviews/client/upload-review-media'
import type { ProductReviewRating } from '@/lib/reviews/model/product-review'

export function useSubmitProductReview({
  item,
  orderId,
}: {
  item: { productId: string; variantId: string }
  orderId: string
}) {
  const { market } = useMarket()
  const createProductReviewMediaUploadFn = useServerFn(
    createProductReviewMediaUpload,
  )
  const submitCustomerProductReviewFn = useServerFn(submitCustomerProductReview)
  const [submitting, setSubmitting] = useState(false)
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
    setSubmitting(true)

    try {
      const media = await Promise.all(
        files.map(async (file) => {
          const bytes = new Uint8Array(await file.arrayBuffer())
          const upload = await createProductReviewMediaUploadFn({
            data: {
              byteSize: file.size,
              checksum: md5Base64(bytes),
              contentType: file.type,
              filename: file.name,
              market: marketInput,
            },
          })

          await uploadReviewMediaFile(upload, file)

          return {
            alt: file.name,
            signedId: upload.signedId,
          }
        }),
      )

      return await submitCustomerProductReviewFn({
        data: {
          answers: Object.fromEntries(
            Object.entries(answers).filter(([, values]) => values.length),
          ),
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
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting }
}
