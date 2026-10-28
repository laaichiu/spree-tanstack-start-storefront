import type { LayoutLinkRenderer } from '../layout/primitives'

export type CheckoutLoadingStateModel = {
  message: string
}

export type CheckoutLoadErrorStateModel = {
  errorMessage: string
  errorTitle: string
  isResetPending: boolean
  resetLabel: string
  resettingLabel: string
}

export type CheckoutUnavailableStateModel = {
  description: string
  eyebrow: string
  shopAllProductsLabel: string
  title: string
}

export type CheckoutConfirmPaymentPageModel = {
  confirmingDescription: string
  confirmingTitle: string
  error: string | null
  errorTitle: string
  returnLabel: string
}

export type CheckoutConfirmPaymentPageCapabilities = {
  renderReturnLink: LayoutLinkRenderer
}

export type CheckoutRouteErrorStateCapabilities = {
  renderCheckoutLink?: LayoutLinkRenderer
  renderProductsLink: LayoutLinkRenderer
}

export type CheckoutRouteErrorStateModel = {
  checkoutLabel?: string
  description: string
  eyebrow: string
  productsLabel: string
  title: string
}

export type CheckoutUnavailableStateCapabilities = {
  renderProductsLink: LayoutLinkRenderer
}
