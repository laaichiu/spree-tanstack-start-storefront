// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertReviewMediaUploadResponse,
  ReviewMediaUploadResponseTypeMismatchError,
} from './review-media-upload-response'

const validResponse = {
  direct_upload: {
    headers: {
      'Content-MD5': 'checksum',
      'Content-Type': 'image/jpeg',
    },
    url: 'https://uploads.example.test/blob?signature=abc',
  },
  signed_id: 'signed_image',
}

describe('review media upload response boundary', () => {
  it('accepts an absolute object-storage upload URL', () => {
    expect(() => assertReviewMediaUploadResponse(validResponse)).not.toThrow()
  })

  it('accepts a root-relative Active Storage upload URL', () => {
    expect(() =>
      assertReviewMediaUploadResponse({
        ...validResponse,
        direct_upload: { ...validResponse.direct_upload, url: '/upload' },
      }),
    ).not.toThrow()
  })

  it('accepts provider-specific storage headers case-insensitively', () => {
    expect(() =>
      assertReviewMediaUploadResponse({
        ...validResponse,
        direct_upload: {
          ...validResponse.direct_upload,
          headers: {
            'Content-Type': 'image/jpeg',
            'X-Amz-Meta-Upload-Source': 'review',
            'x-goog-meta-upload-source': 'review',
            'X-MS-Blob-Type': 'BlockBlob',
          },
        },
      }),
    ).not.toThrow()
  })

  it.each([
    ['missing signed id', { signed_id: undefined }],
    ['blank signed id', { signed_id: '   ' }],
    ['missing direct upload', { direct_upload: undefined }],
    ['non-http URL', { direct_upload: { url: 'ftp://uploads.test/blob' } }],
    [
      'protocol-relative URL',
      { direct_upload: { url: '//uploads.test/blob' } },
    ],
    [
      'URL with credentials',
      { direct_upload: { url: 'https://user:pass@uploads.test/blob' } },
    ],
    [
      'URL with fragment',
      { direct_upload: { url: 'https://uploads.test/blob#fragment' } },
    ],
    ['header collection with wrong shape', { direct_upload: { headers: [] } }],
    [
      'header with non-string value',
      { direct_upload: { headers: { 'Content-Type': 42 } } },
    ],
    [
      'header with invalid name',
      { direct_upload: { headers: { 'Content Type': 'image/jpeg' } } },
    ],
    [
      'header with CRLF value',
      {
        direct_upload: {
          headers: { 'Content-Type': 'image/jpeg\r\nX-Test: 1' },
        },
      },
    ],
    [
      'sensitive header',
      {
        direct_upload: {
          headers: { Authorization: 'Bearer secret' },
        },
      },
    ],
    [
      'session header',
      {
        direct_upload: {
          headers: { Cookie: 'customer_session=secret' },
        },
      },
    ],
    [
      'backend credential header',
      {
        direct_upload: {
          headers: { 'X-Spree-Api-Key': 'pk_secret' },
        },
      },
    ],
  ])('rejects a malformed %s', (_reason, override) => {
    const directUploadOverride =
      'direct_upload' in override && override.direct_upload
        ? override.direct_upload
        : undefined
    const response = {
      ...validResponse,
      ...override,
      ...(directUploadOverride
        ? {
            direct_upload: {
              ...validResponse.direct_upload,
              ...directUploadOverride,
            },
          }
        : {}),
    }

    expect(() => assertReviewMediaUploadResponse(response)).toThrow(
      ReviewMediaUploadResponseTypeMismatchError,
    )
  })
})
