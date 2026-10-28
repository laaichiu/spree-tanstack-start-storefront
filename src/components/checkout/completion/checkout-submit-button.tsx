import { useMarket } from '@/components/layout/market-provider'
import { getCheckoutSubmitAction } from '@/lib/checkout/contracts'
import type { MessageKey } from '@/lib/i18n/messages'
import { CheckoutSubmitButtonView } from '@/components/checkout/checkout-submit-button-view'

type CheckoutSubmitButtonLabelOptions = {
  amountDueAmount: number | null
  hasSessionPaymentMethod: boolean
  isPending: boolean
}

function getCheckoutSubmitButtonLabelKey({
  amountDueAmount,
  hasSessionPaymentMethod,
  isPending,
}: CheckoutSubmitButtonLabelOptions): MessageKey {
  const action = getCheckoutSubmitAction({
    amountDueAmount,
    hasSessionPaymentMethod,
    isPending,
  })

  switch (action) {
    case 'pay_now':
      return 'checkout.payNow'
    case 'processing_payment':
      return 'checkout.processingPayment'
    case 'place_order':
      return 'checkout.placeOrder'
  }
}

export function CheckoutSubmitButton({
  amountDueAmount,
  disabled,
  hasSessionPaymentMethod,
  isPending,
  onSubmit,
}: CheckoutSubmitButtonLabelOptions & {
  disabled: boolean
  onSubmit: () => void
}) {
  const { t } = useMarket()

  return (
    <CheckoutSubmitButtonView
      disabled={disabled}
      label={t(
        getCheckoutSubmitButtonLabelKey({
          amountDueAmount,
          hasSessionPaymentMethod,
          isPending,
        }),
      )}
      onSubmit={onSubmit}
    />
  )
}
