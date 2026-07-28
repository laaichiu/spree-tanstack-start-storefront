import type { ReactNode } from 'react'

type EmptyStateProps = {
  actions?: ReactNode
  description: string
  title: string
}

export function EmptyState({ actions, description, title }: EmptyStateProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="border border-dashed border-foreground/30 bg-muted p-8">
        <h2 className="text-2xl leading-tight sm:text-3xl text-foreground">
          {title}
        </h2>
        <p className="text-sm leading-6 mt-4 max-w-2xl text-muted-foreground">
          {description}
        </p>
        {actions ? (
          <div className="mt-6 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  )
}
