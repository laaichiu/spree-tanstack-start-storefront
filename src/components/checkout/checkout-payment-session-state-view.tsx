import type { CheckoutPaymentSessionNoticeModel } from '../contracts/checkout'

export type { CheckoutPaymentSessionNoticeModel } from '../contracts/checkout'

export function CheckoutPaymentFormSkeletonView({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="space-y-4 py-1"
      role="status"
    >
      <div className="grid grid-cols-2 gap-3">
        <span className="h-12 animate-pulse rounded-sm border border-border bg-muted motion-reduce:animate-none" />
        <span className="h-12 animate-pulse rounded-sm border border-border bg-muted motion-reduce:animate-none" />
      </div>
      <div className="space-y-3">
        <span className="block h-4 w-40 animate-pulse rounded-sm bg-muted motion-reduce:animate-none" />
        <span className="block h-12 animate-pulse rounded-sm border border-border bg-muted motion-reduce:animate-none" />
        <div className="grid grid-cols-2 gap-3">
          <span className="h-12 animate-pulse rounded-sm border border-border bg-muted motion-reduce:animate-none" />
          <span className="h-12 animate-pulse rounded-sm border border-border bg-muted motion-reduce:animate-none" />
        </div>
        <span className="block h-12 animate-pulse rounded-sm border border-border bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  )
}

export function CheckoutPaymentSessionNoticeView({
  model,
}: {
  model: CheckoutPaymentSessionNoticeModel
}) {
  const content = (
    <p className="text-xs leading-6 text-muted-foreground">{model.message}</p>
  )

  if (model.variant === 'card') {
    return <div className="border border-border px-4 py-3">{content}</div>
  }

  return <div className="py-3">{content}</div>
}
