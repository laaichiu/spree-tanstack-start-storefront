import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'
import type { MessageKey } from '@/lib/i18n/messages'

type CheckoutSubmitButtonLabelOptions = {
  amountDueAmount: number
  hasSessionPaymentMethod: boolean
  isPending: boolean
}

export function getCheckoutSubmitButtonLabelKey({
  amountDueAmount,
  hasSessionPaymentMethod,
  isPending,
}: CheckoutSubmitButtonLabelOptions): MessageKey {
  if (isPending) {
    return 'checkout.processingPayment'
  }

  if (amountDueAmount > 0 && hasSessionPaymentMethod) {
    return 'checkout.payNow'
  }

  return 'checkout.placeOrder'
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
    <button
      className={buttonClassName({
        className: 'h-14 w-full bg-foreground text-background',
        size: 'lg',
      })}
      disabled={disabled}
      onClick={onSubmit}
      type="button"
    >
      {t(
        getCheckoutSubmitButtonLabelKey({
          amountDueAmount,
          hasSessionPaymentMethod,
          isPending,
        }),
      )}
    </button>
  )
}
