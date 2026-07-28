import { CircleAlert } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { Button } from '@/components/ui/button'
import type { CheckoutPaymentMethod } from '@/lib/checkout/model/checkout'

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
    <div className="mt-3 border border-destructive bg-muted px-4 py-3">
      <p className="flex items-center gap-2 text-sm leading-5 text-destructive">
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
        {error}
      </p>
      {canRetryPaymentSession ? (
        <Button
          className="mt-3"
          disabled={isBusy}
          onClick={onRetry}
          size="sm"
          type="button"
          variant="secondary"
        >
          {t('checkout.retryPaymentSetup')}
        </Button>
      ) : null}
    </div>
  )
}
