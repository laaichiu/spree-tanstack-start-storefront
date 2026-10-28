export type CheckoutPaymentSessionProviderData = {
  clientSecret: string | null
}

export type CheckoutPaymentSessionInputData = {
  stripePaymentMethodId?: string
}

export type CheckoutPaymentSession = {
  providerData: CheckoutPaymentSessionProviderData
  id: string
  status: string
}
