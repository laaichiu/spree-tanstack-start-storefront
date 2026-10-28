export function formatReviewRating(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0'
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}
