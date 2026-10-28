import { CircleAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { CheckoutPaymentMethodErrorModel } from '../contracts/checkout'

export type { CheckoutPaymentMethodErrorModel } from '../contracts/checkout'

export function CheckoutPaymentMethodErrorView({
  model,
  onRetry,
}: {
  model: CheckoutPaymentMethodErrorModel
  onRetry: () => void
}) {
  if (!model.error) {
    return null
  }

  return (
    <div className="mt-3 border border-destructive bg-muted px-4 py-3">
      <p className="flex items-center gap-2 text-xs leading-5 text-destructive">
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
        {model.error}
      </p>
      {model.isRetryable && (
        <Button
          className="mt-3"
          disabled={model.retryDisabled}
          onClick={onRetry}
          size="sm"
          type="button"
          variant="secondary"
        >
          {model.retryLabel}
        </Button>
      )}
    </div>
  )
}
