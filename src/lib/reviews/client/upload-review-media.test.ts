import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  resolveReviewMediaUploadUrl,
  uploadReviewMediaFile,
} from './upload-review-media'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('review media upload', () => {
  it('routes Rails Disk uploads through the same-origin development proxy', () => {
    expect(
      resolveReviewMediaUploadUrl(
        'http://localhost:3000/rails/active_storage/disk/signed-token?disposition=attachment',
        true,
      ),
    ).toBe('/rails/active_storage/disk/signed-token?disposition=attachment')
  })

  it('preserves external object-storage and production upload URLs', () => {
    expect(
      resolveReviewMediaUploadUrl(
        'https://uploads.example.com/reviews/signed-object',
        true,
      ),
    ).toBe('https://uploads.example.com/reviews/signed-object')
    expect(
      resolveReviewMediaUploadUrl(
        'https://api.example.com/rails/active_storage/disk/signed-token',
        false,
      ),
    ).toBe('https://api.example.com/rails/active_storage/disk/signed-token')
  })

  it('uses the Rails proxy path for a development upload', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['review image'], 'review.jpg', {
      type: 'image/jpeg',
    })

    await uploadReviewMediaFile(
      {
        headers: { 'Content-Type': 'image/jpeg' },
        signedId: 'signed_blob',
        url: 'http://localhost:3000/rails/active_storage/disk/signed-token',
      },
      file,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/rails/active_storage/disk/signed-token',
      {
        body: file,
        headers: { 'Content-Type': 'image/jpeg' },
        method: 'PUT',
      },
    )
  })
})
