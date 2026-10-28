// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createProductReviewMediaUpload } from './customer-review-media.functions'

const server = vi.hoisted(() => ({
  mapUpload: vi.fn(),
  parseMediaUploadInput: vi.fn(),
  requireReviewsEnabled: vi.fn(),
  resolveReviewsRequestContext: vi.fn(),
}))

const client = {
  request: vi.fn(),
}

const market = {
  country: 'de',
  currencyCode: 'EUR',
  locale: 'de-DE',
}

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    let inputValidator: unknown
    const builder = {
      handler: (handler: unknown) => (options: { data: unknown }) => {
        const validatedData =
          typeof inputValidator === 'function'
            ? (inputValidator as (data: unknown) => unknown)(options.data)
            : options.data

        return (handler as (options: { data: unknown }) => unknown)({
          data: validatedData,
        })
      },
      validator: (validator: unknown) => {
        inputValidator = validator
        return builder
      },
    }

    return builder
  },
}))

vi.mock('./customer-review-inputs.server', () => ({
  parseMediaUploadInput: server.parseMediaUploadInput,
  requireReviewsEnabled: server.requireReviewsEnabled,
}))

vi.mock('./reviews-request.server', () => ({
  resolveReviewsRequestContext: server.resolveReviewsRequestContext,
}))

vi.mock('../mappers/product-review-form.mapper', () => ({
  mapProductReviewMediaUpload: server.mapUpload,
}))

const input = {
  byteSize: 12,
  checksum: 'checksum',
  contentType: 'image/jpeg',
  filename: 'review.jpg',
  market: { country: 'de', locale: 'de-DE' },
}

describe('customer review media upload server function', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.parseMediaUploadInput.mockImplementation(async (value) => value)
    server.resolveReviewsRequestContext.mockResolvedValue({ client, market })
    server.mapUpload.mockReturnValue({
      headers: { 'Content-Type': 'image/jpeg' },
      signedId: 'signed_image',
      url: 'https://uploads.example.test/blob?signature=abc',
    })
  })

  it('maps the direct-upload response before returning it to the browser', async () => {
    const upload = server.mapUpload()
    client.request.mockResolvedValue({
      direct_upload: {
        headers: { 'Content-Type': 'image/jpeg' },
        url: 'https://uploads.example.test/blob?signature=abc',
      },
      signed_id: 'signed_image',
    })

    await expect(createProductReviewMediaUpload({ data: input })).resolves.toBe(
      upload,
    )

    expect(client.request).toHaveBeenCalledWith(
      'POST',
      '/review_media/direct_uploads',
      {
        body: {
          blob: {
            byte_size: 12,
            checksum: 'checksum',
            content_type: 'image/jpeg',
            filename: 'review.jpg',
          },
        },
      },
    )
    expect(server.mapUpload).toHaveBeenCalledWith({
      direct_upload: {
        headers: { 'Content-Type': 'image/jpeg' },
        url: 'https://uploads.example.test/blob?signature=abc',
      },
      signed_id: 'signed_image',
    })
  })

  it('does not return an unmapped response when the mapper rejects it', async () => {
    client.request.mockResolvedValue({
      direct_upload: { headers: { 'Content-Type': 42 }, url: '/upload' },
      signed_id: 'signed_image',
    })
    server.mapUpload.mockImplementation(() => {
      throw new Error('The review media upload response is malformed.')
    })

    await expect(
      createProductReviewMediaUpload({ data: input }),
    ).rejects.toThrow('The review media upload response is malformed.')
  })
})
