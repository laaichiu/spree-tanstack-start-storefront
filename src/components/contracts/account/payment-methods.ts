import type { CustomerAccountPaymentCardDisplay } from '@/components/account/account-payment-card-display'

export type AccountPaymentMethodCardLabels = {
  cardEndingIn: string
  cardExpires: string
  defaultPaymentMethod: string
  remove: string
  removing: string
}

export type AccountPaymentMethodCardModel = {
  card: CustomerAccountPaymentCardDisplay
  isPending: boolean
  labels: AccountPaymentMethodCardLabels
}

export type AccountPaymentMethodsSectionLabels = {
  noPaymentMethods: string
  noPaymentMethodsDescription: string
  paymentMethods: string
  paymentMethodsDescription: string
  paymentMethodsLoadFailed: string
  paymentMethodsLoadFailedDescription: string
  securePaymentMethodsDescription: string
}

export type AccountPaymentMethodsSectionModel =
  | {
      labels: AccountPaymentMethodsSectionLabels
      status: 'load-error'
    }
  | {
      cards: readonly AccountPaymentMethodCardModel[]
      errorMessage?: string
      labels: AccountPaymentMethodsSectionLabels
      status: 'ready'
    }
