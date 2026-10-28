import { buttonClassName } from '@/components/ui/button'
import type { ReactNode } from 'react'

export type EmptyStateModel = {
  actionLabel?: string
  description: string
  title: string
}

export type EmptyStateCapabilities = {
  renderAction?: (content: ReactNode, className?: string) => ReactNode
}

export function EmptyStateView({
  capabilities,
  model,
}: {
  capabilities?: EmptyStateCapabilities
  model: EmptyStateModel
}) {
  const action =
    model.actionLabel && capabilities?.renderAction
      ? capabilities.renderAction(
          model.actionLabel,
          buttonClassName({ variant: 'secondary' }),
        )
      : undefined

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="border border-dashed border-foreground/30 bg-muted p-8">
        <h2 className="text-lg md:text-xl text-foreground">{model.title}</h2>
        <p className="mt-4 max-w-2xl text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
        {action && <div className="mt-6 flex flex-wrap gap-3">{action}</div>}
      </div>
    </section>
  )
}
