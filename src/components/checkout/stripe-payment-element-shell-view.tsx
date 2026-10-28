import type { ReactNode } from 'react'

export function StripePaymentElementShellView({
  children,
}: {
  children: ReactNode
}) {
  return <div className="space-y-3">{children}</div>
}
