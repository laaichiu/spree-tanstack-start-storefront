export function sanitizeStripeSecrets(text: string) {
  return text
    .replace(/\b(?:sk|pk|rk|ek)_(?:test|live)_[A-Za-z0-9_*]+/g, '[redacted]')
    .replace(/\b(?:pi|seti)_[A-Za-z0-9_]*_secret_[A-Za-z0-9_*]+/g, '[redacted]')
    .replace(/\bwhsec_[A-Za-z0-9_*]+/g, '[redacted]')
}

export function sanitizeStripeUrl(url: string) {
  try {
    const parsed = new URL(url)
    return sanitizeStripeSecrets(`${parsed.origin}${parsed.pathname}`)
  } catch {
    return '[invalid URL]'
  }
}
