import { CircleAlert } from 'lucide-react'

export function StripePaymentElementErrorView({
  message,
}: {
  message: string
}) {
  return (
    <div className="border border-destructive bg-muted px-4 py-3">
      <p className="flex items-center gap-2 text-xs leading-5 text-destructive">
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
        {message}
      </p>
    </div>
  )
}
