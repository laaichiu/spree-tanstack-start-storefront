import { useMarket } from '@/components/layout/market-provider'
import type { CheckoutPaymentMethod } from '@/lib/checkout/contracts'
import { CheckoutPaymentMethodErrorView } from '@/components/checkout/checkout-payment-method-error-view'

export function CheckoutPaymentMethodError({
  clientSecret,
  disabled,
  error,
  isBusy,
  isRetryable,
  method,
  onRetry,
}: {
  clientSecret?: string
  disabled: boolean
  error: string | null
  isBusy: boolean
  isRetryable: boolean
  method: CheckoutPaymentMethod
  onRetry: () => void
}) {
  const { t } = useMarket()

  if (!error) {
    return null
  }

  const canRetryPaymentSession =
    isRetryable &&
    method.sessionRequired &&
    method.gatewayId === 'stripe' &&
    !clientSecret &&
    !disabled

  return (
    <CheckoutPaymentMethodErrorView
      model={{
        error,
        isRetryable: canRetryPaymentSession,
        retryDisabled: isBusy,
        retryLabel: t('checkout.retryPaymentSetup'),
      }}
      onRetry={onRetry}
    />
  )
}
