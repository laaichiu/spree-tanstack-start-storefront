export const REVIEW_MEDIA_UPLOAD_RESPONSE_TYPE_MISMATCH_MESSAGE =
  'The review media upload response is malformed.'

export class ReviewMediaUploadResponseTypeMismatchError extends Error {
  constructor() {
    super(REVIEW_MEDIA_UPLOAD_RESPONSE_TYPE_MISMATCH_MESSAGE)
    this.name = 'ReviewMediaUploadResponseTypeMismatchError'
  }
}

export type ReviewMediaUploadResponse = {
  direct_upload: {
    headers: Record<string, string>
    url: string
  }
  signed_id: string
}

type UnknownRecord = Record<string, unknown>

const HTTP_HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
const SAFE_DIRECT_UPLOAD_HEADER_NAMES = new Set([
  'cache-control',
  'content-disposition',
  'content-md5',
  'content-type',
])
const SAFE_DIRECT_UPLOAD_HEADER_PREFIXES = ['x-amz-', 'x-goog-', 'x-ms-']

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function isDirectUploadUrl(value: unknown): value is string {
  if (!isNonBlankString(value)) {
    return false
  }

  const candidate = value.trim()

  // Only root-relative URLs are accepted for same-origin proxying. Reject
  // protocol-relative paths and backslashes, which browsers normalize into
  // cross-origin URLs.
  if (candidate.startsWith('/')) {
    return !candidate.startsWith('//') && !candidate.includes('\\')
  }

  try {
    const parsed = new URL(candidate)

    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.hash
    )
  } catch {
    return false
  }
}

function isDirectUploadHeaders(
  value: unknown,
): value is Record<string, string> {
  if (!isRecord(value)) {
    return false
  }

  return Object.entries(value).every(
    ([key, item]) =>
      HTTP_HEADER_NAME_PATTERN.test(key) &&
      isSafeDirectUploadHeaderName(key) &&
      typeof item === 'string' &&
      !/[\r\n]/.test(item),
  )
}

function isSafeDirectUploadHeaderName(value: string) {
  const normalized = value.toLowerCase()

  return (
    SAFE_DIRECT_UPLOAD_HEADER_NAMES.has(normalized) ||
    SAFE_DIRECT_UPLOAD_HEADER_PREFIXES.some((prefix) =>
      normalized.startsWith(prefix),
    )
  )
}

export function assertReviewMediaUploadResponse(
  response: unknown,
): asserts response is ReviewMediaUploadResponse {
  if (
    !isRecord(response) ||
    !isNonBlankString(response.signed_id) ||
    !isRecord(response.direct_upload) ||
    !isDirectUploadUrl(response.direct_upload.url) ||
    !isDirectUploadHeaders(response.direct_upload.headers)
  ) {
    throw new ReviewMediaUploadResponseTypeMismatchError()
  }
}
