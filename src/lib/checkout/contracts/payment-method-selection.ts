import type { CheckoutPaymentMethod } from './checkout'

export type CheckoutPaymentMethodSelection = {
  method: CheckoutPaymentMethod | null
  methodId: string
}

export function getSelectedCheckoutPaymentMethod({
  paymentMethods,
  selectedPaymentMethodId,
}: {
  paymentMethods: readonly CheckoutPaymentMethod[]
  selectedPaymentMethodId: string
}): CheckoutPaymentMethod | null {
  return (
    paymentMethods.find((method) => method.id === selectedPaymentMethodId) ??
    paymentMethods.at(0) ??
    null
  )
}

export function getCheckoutPaymentMethodSelection({
  paymentMethods,
  selectedPaymentMethodId,
}: {
  paymentMethods: readonly CheckoutPaymentMethod[]
  selectedPaymentMethodId: string
}): CheckoutPaymentMethodSelection {
  const method = getSelectedCheckoutPaymentMethod({
    paymentMethods,
    selectedPaymentMethodId,
  })

  return {
    method,
    methodId: method?.id ?? '',
  }
}
