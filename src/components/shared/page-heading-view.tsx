import type { ReactNode } from 'react'

export type PageHeadingModel = {
  eyebrow?: string
  title: string
}

export function PageHeadingView({
  children,
  model,
}: {
  children?: ReactNode
  model: PageHeadingModel
}) {
  return (
    <header className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      {model.eyebrow ? (
        <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
          {model.eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl leading-tight md:text-3xl break-words mt-4 text-foreground">
        {model.title}
      </h1>
      {children ? (
        <div className="mt-4 max-w-2xl text-xs leading-6 text-muted-foreground">
          {children}
        </div>
      ) : null}
    </header>
  )
}
