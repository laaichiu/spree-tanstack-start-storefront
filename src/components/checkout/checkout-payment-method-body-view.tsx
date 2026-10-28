import type {
  CheckoutPaymentMethodBodySlots,
  CheckoutPaymentMethodNoticeModel,
} from '../contracts/checkout'

export type {
  CheckoutPaymentMethodBodySlots,
  CheckoutPaymentMethodNoticeModel,
} from '../contracts/checkout'

export function CheckoutPaymentMethodBodyView({
  slots,
}: {
  slots: CheckoutPaymentMethodBodySlots
}) {
  return (
    <div className="border-t border-border bg-background px-4 py-4">
      {slots.content}
      {slots.error}
    </div>
  )
}

export function CheckoutPaymentMethodNoticeView({
  model,
}: {
  model: CheckoutPaymentMethodNoticeModel
}) {
  return (
    <div
      className={
        model.tone === 'error'
          ? 'border border-destructive bg-muted px-4 py-3'
          : 'border border-border px-4 py-3'
      }
    >
      <p
        className={
          model.tone === 'error'
            ? 'text-xs leading-6 text-destructive'
            : 'text-xs leading-6 text-muted-foreground'
        }
      >
        {model.message}
      </p>
    </div>
  )
}
