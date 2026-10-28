import { CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'

export function AccountPasswordResetSuccessView({
  description,
  signInLink,
}: {
  description: string
  signInLink: ReactNode
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border text-foreground">
        <CircleCheck aria-hidden="true" className="h-5 w-5" />
      </div>
      <p className="mx-auto max-w-md text-xs leading-6 text-muted-foreground">
        {description}
      </p>
      {signInLink}
    </div>
  )
}
