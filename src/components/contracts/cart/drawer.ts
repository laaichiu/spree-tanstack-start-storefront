import type { ReactNode } from 'react'
import type { CartErrorStateModel } from './states'

export type CartSummaryPresentation = {
  discount?: string
  itemTotal: string
  shipping?: string
  tax?: string
  total: string
}

export type CartDrawerFooterPresentation = {
  itemTotal: string
  shipping: string
  total: string
}

export type CartDrawerHeaderDisplay = {
  freeShipping?: {
    message: string
    progressPercent: number
  }
  itemCountLabel: string
}

export type CartOrderSummaryModel = CartSummaryPresentation & {
  labels: {
    continueShopping: string
    discount: string
    orderSummary: string
    proceedToCheckout: string
    returnPolicy: string
    shipping: string
    shippingCalculatedAtCheckout: string
    shippingNote: string
    shippingPolicy: string
    subtotal: string
    tax: string
    total: string
  }
}

export type CartDrawerFooterModel = CartDrawerFooterPresentation & {
  labels: {
    checkout: string
    returnsWindow: string
    secureCheckout: string
    shipping: string
    subtotal: string
    total: string
  }
}

export type CartDrawerHeaderModel = CartDrawerHeaderDisplay & {
  labels: {
    closeCart: string
    yourBag: string
  }
}

export type CartDrawerShellActions = {
  openChange: (open: boolean, triggerId?: string | null) => void
}

export type CartDrawerShellSlots = {
  body: ReactNode
  footer: ReactNode
  header: ReactNode
}

export type CartDrawerEmptyStateModel = {
  actionLabel: string
  description: string
  title: string
}

export type CartDrawerBodyModel =
  | {
      loadingLabel: string
      status: 'loading'
    }
  | {
      error: CartErrorStateModel
      status: 'error'
    }
  | {
      empty: CartDrawerEmptyStateModel
      status: 'empty'
    }
  | {
      mutationError: string | null
      status: 'ready'
    }
