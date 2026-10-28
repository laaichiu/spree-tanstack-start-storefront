import { createServerFn } from '@tanstack/react-start'

import type { ProductReviewMediaUpload } from '../model/product-review'
import {
  parseMediaUploadInput,
  requireReviewsEnabled,
} from './customer-review-inputs.server'
import { resolveReviewsRequestContext } from './reviews-request.server'

export const createProductReviewMediaUpload = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProductReviewMediaUpload> => {
    requireReviewsEnabled()
    const input = await parseMediaUploadInput(data)
    const context = await resolveReviewsRequestContext(input.market)

    if (!context) {
      throw new Error('Product reviews are disabled.')
    }

    const response = await context.client.request<unknown>(
      'POST',
      '/review_media/direct_uploads',
      {
        body: {
          blob: {
            byte_size: input.byteSize,
            checksum: input.checksum,
            content_type: input.contentType,
            filename: input.filename,
          },
        },
      },
    )
    const { mapProductReviewMediaUpload } =
      await import('../mappers/product-review-form.mapper')
    const upload = mapProductReviewMediaUpload(response)

    if (!upload.signedId || !upload.url) {
      throw new Error('Review image upload could not be prepared.')
    }

    return upload
  })
