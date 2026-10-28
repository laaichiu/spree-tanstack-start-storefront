export type CheckoutSubmitAction =
  'pay_now' | 'place_order' | 'processing_payment'

export function getCheckoutSubmitAction({
  amountDueAmount,
  hasSessionPaymentMethod,
  isPending,
}: {
  amountDueAmount: number | null
  hasSessionPaymentMethod: boolean
  isPending: boolean
}): CheckoutSubmitAction {
  if (isPending) {
    return 'processing_payment'
  }

  if (
    amountDueAmount !== null &&
    amountDueAmount > 0 &&
    hasSessionPaymentMethod
  ) {
    return 'pay_now'
  }

  return 'place_order'
}
