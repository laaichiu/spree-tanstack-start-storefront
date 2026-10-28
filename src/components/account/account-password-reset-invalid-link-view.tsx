import { CircleAlert } from 'lucide-react'

export function AccountPasswordResetInvalidLinkView({
  description,
}: {
  description: string
}) {
  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-destructive text-destructive">
        <CircleAlert aria-hidden="true" className="h-5 w-5" />
      </div>
      <p className="mx-auto max-w-md text-xs leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
