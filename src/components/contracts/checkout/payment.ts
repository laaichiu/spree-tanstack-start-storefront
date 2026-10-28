import type { ReactNode } from 'react'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import type { CheckoutSavedPaymentCardOptionDisplay } from '@/components/checkout/payment/checkout-saved-payment-card-display'
import type { CheckoutSectionModel } from './form'

export type CheckoutPaymentSectionModel = CheckoutSectionModel & {
  hasPaymentMethods: boolean
  noPaymentMethodsDescription: string
}

export type CheckoutPaymentSectionSlots = {
  billingAddress?: ReactNode
  payment: ReactNode
}

export type CheckoutPaymentMethodErrorModel = {
  error: string | null
  isRetryable: boolean
  retryDisabled: boolean
  retryLabel: string
}

export type CheckoutPaymentMethodNoticeModel = {
  message: string
  tone: 'error' | 'neutral'
}

export type CheckoutPaymentMethodBodySlots = {
  content: ReactNode
  error: ReactNode
}

export type CheckoutPaymentSessionNoticeModel = {
  message: string
  variant: 'card' | 'inline'
}

export type CheckoutPaymentSessionElementSlots = {
  loading?: ReactNode
  payment: ReactNode
}

export type CheckoutExpressCheckoutModel = {
  error: string | null
  isLoading: boolean
  isProcessing: boolean
  isReady: boolean
  orLabel: string
  processingLabel: string
  title: string
}

export type CheckoutExpressCheckoutSlots = {
  paymentElement: ReactNode
}

export type CheckoutPaymentMethodOption = Pick<
  CheckoutPaymentMethod,
  'description' | 'id' | 'name'
>
export type CheckoutPaymentMethodListModel = {
  disabled: boolean
  methods: readonly CheckoutPaymentMethodOption[]
  selectedPaymentMethodId: string
}

export type CheckoutPaymentMethodListCapabilities = {
  renderPaymentMethodBody: (paymentMethodId: string) => ReactNode
}

export type CheckoutSavedPaymentCardsModel = {
  addNewLabel: string
  cards: readonly CheckoutSavedPaymentCardOptionDisplay[]
  defaultLabel: string
  disabled: boolean
  selectedPaymentProfileId: string | null
  title: string
}
