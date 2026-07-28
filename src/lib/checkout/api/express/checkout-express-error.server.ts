import '@tanstack/react-start/server-only'

export function readExpressCheckoutErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error && error.message ? error.message : fallback
}
