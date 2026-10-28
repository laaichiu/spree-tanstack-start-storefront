import { CircleAlert, Mail } from 'lucide-react'

import { AccountMessage } from './account-ui-view'

export function AccountAuthMessageView({
  message,
  tone,
}: {
  message: string
  tone: 'error' | 'success'
}) {
  return (
    <AccountMessage
      className={
        tone === 'error'
          ? 'border-destructive bg-muted px-4 py-3 text-destructive'
          : 'border-border bg-muted px-4 py-3 text-foreground'
      }
    >
      {tone === 'error' ? (
        <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <p className="text-xs leading-6">{message}</p>
    </AccountMessage>
  )
}
