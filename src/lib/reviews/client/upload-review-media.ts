import type { ProductReviewMediaUpload } from '../model/product-review'

export function resolveReviewMediaUploadUrl(
  uploadUrl: string,
  useRailsProxy = import.meta.env.DEV,
) {
  if (!useRailsProxy) {
    return uploadUrl
  }

  try {
    const parsedUrl = new URL(uploadUrl)

    if (parsedUrl.pathname.startsWith('/rails/active_storage/')) {
      return `${parsedUrl.pathname}${parsedUrl.search}`
    }
  } catch {
    return uploadUrl
  }

  return uploadUrl
}

export async function uploadReviewMediaFile(
  upload: ProductReviewMediaUpload,
  file: File,
) {
  const response = await fetch(resolveReviewMediaUploadUrl(upload.url), {
    body: file,
    headers: upload.headers,
    method: 'PUT',
  })

  if (!response.ok) {
    throw new Error('Review image upload failed.')
  }
}
