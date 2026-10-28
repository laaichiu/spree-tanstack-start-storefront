export type ProductReviewSubmissionAnswers = Record<string, string | string[]>

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Keeps only non-blank review answers in the payload shape accepted by the
 * review submission boundary.
 *
 * This stays framework-independent so the browser submit adapter and the
 * server mutation validator normalize answers identically.
 */
export function normalizeProductReviewAnswers(
  answers: Readonly<Record<string, unknown>>,
): ProductReviewSubmissionAnswers {
  const normalized: ProductReviewSubmissionAnswers = {}

  for (const [key, value] of Object.entries(answers)) {
    const normalizedKey = key.trim()

    if (!normalizedKey) {
      continue
    }

    if (typeof value === 'string') {
      const normalizedValue = value.trim()

      if (normalizedValue) {
        normalized[normalizedKey] = normalizedValue
      }

      continue
    }

    if (isStringArray(value)) {
      const normalizedValues = value.map((item) => item.trim()).filter(Boolean)

      if (normalizedValues.length) {
        normalized[normalizedKey] = normalizedValues
      }
    }
  }

  return normalized
}
