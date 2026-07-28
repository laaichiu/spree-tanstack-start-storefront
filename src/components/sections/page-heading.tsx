import type { ReactNode } from 'react'

type PageHeadingProps = {
  children?: ReactNode
  eyebrow?: string
  title: string
}

export function PageHeading({ children, eyebrow, title }: PageHeadingProps) {
  return (
    <header className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {eyebrow ? (
        <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl leading-tight sm:text-3xl mt-4 text-foreground">
        {title}
      </h1>
      {children ? (
        <div className="text-sm leading-6 mt-4 max-w-2xl text-muted-foreground">
          {children}
        </div>
      ) : null}
    </header>
  )
}
