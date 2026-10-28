export type StripePaymentElementResult = {
  displayError?: boolean
  error?: string
}

export type StripePaymentElementHandle = {
  confirmPayment: (returnUrl: string) => Promise<StripePaymentElementResult>
  fetchUpdates: () => Promise<void>
}

export type StripePaymentElementProps = {
  clientSecret: string
  confirmPaymentFallbackMessage: string
  onCompleteChange?: (complete: boolean) => void
  onReady: (handle: StripePaymentElementHandle) => void
  onElementReady?: () => void
  stripeNotLoadedMessage: string
}
