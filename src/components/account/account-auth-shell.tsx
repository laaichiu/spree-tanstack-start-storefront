import type { ReactNode } from 'react'

export function AccountAuthShell({
  children,
  description,
  footer,
  label,
  supportingContent,
  title,
}: {
  children: ReactNode
  description?: ReactNode
  footer?: ReactNode
  label?: ReactNode
  supportingContent?: ReactNode
  title: ReactNode
}) {
  return (
    <section className="mx-auto flex min-h-160 w-full max-w-304 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-160 border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8 lg:p-10">
        <div className="text-center">
          {label ? (
            <p className="text-sm tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
          ) : null}
          <h1
            className={`text-2xl leading-tight font-normal tracking-wider text-foreground ${label ? 'mt-4' : ''}`}
          >
            {title}
          </h1>
          {description ? (
            <div className="mx-auto mt-4 max-w-md text-lg leading-7 text-muted-foreground">
              {description}
            </div>
          ) : null}
          {supportingContent ? (
            <div className="mx-auto mt-3 max-w-md text-lg leading-7 text-muted-foreground">
              {supportingContent}
            </div>
          ) : null}
        </div>

        <div className="mt-10">{children}</div>

        {footer ? (
          <div className="mt-6 text-center text-sm leading-6 text-muted-foreground">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  )
}
