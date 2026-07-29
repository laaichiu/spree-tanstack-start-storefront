import '@tanstack/react-start/server-only'

function getStorefrontOrigin() {
  const configuredUrl = import.meta.env.VITE_STOREFRONT_URL?.trim()

  if (!configuredUrl) {
    if (import.meta.env.PROD) {
      throw new Error('VITE_STOREFRONT_URL is required for payment redirects.')
    }

    return 'http://localhost:3006'
  }

  let url: URL

  try {
    url = new URL(configuredUrl)
  } catch {
    throw new Error('VITE_STOREFRONT_URL must be a valid HTTP or HTTPS URL.')
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    !url.hostname
  ) {
    throw new Error('VITE_STOREFRONT_URL must be a valid HTTP or HTTPS URL.')
  }

  return url.origin
}

export function buildServerCheckoutPaymentReturnUrl({
  cartId,
  country,
  locale,
}: {
  cartId: string
  country: string
  locale: string
}) {
  const path = [country, locale, 'confirm-payment', cartId]
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return new URL(`/${path}`, `${getStorefrontOrigin()}/`).toString()
}
