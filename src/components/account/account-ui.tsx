import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export const accountInlineLinkClassName =
  'text-lg font-normal text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:focus-ring'

export const accountTextLinkClassName =
  'relative inline-flex w-fit max-w-full items-center gap-1 text-sm tracking-wider text-foreground uppercase after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:after:scale-x-100'

export const accountAuthLabelClassName =
  'text-lg font-normal tracking-wider normal-case text-foreground'

export const accountAuthInputClassName =
  'h-12 rounded-sm bg-background text-lg leading-5'

export function AccountPageHeader({
  action,
  description,
  label,
  title,
}: {
  action?: ReactNode
  description?: ReactNode
  label?: ReactNode
  title: ReactNode
}) {
  return (
    <header className="border-b border-border pb-6">
      {label ? (
        <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl leading-tight font-normal text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-lg leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  )
}

export function AccountSectionHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description?: ReactNode
  title: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-normal text-foreground">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function AccountSurface({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'border border-border bg-card p-5 text-card-foreground sm:p-7',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export function AccountEmptyState({
  action,
  description,
  icon,
  title,
}: {
  action?: ReactNode
  description: ReactNode
  icon?: ReactNode
  title: ReactNode
}) {
  return (
    <AccountSurface className="text-center">
      {icon ? (
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h2 className="mt-5 text-lg font-normal text-foreground">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </AccountSurface>
  )
}

export function AccountPill({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center border border-border px-2.5 py-1 text-sm tracking-wider text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function AccountMessage({
  children,
  className,
  tone = 'default',
}: HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'error' | 'success'
}) {
  return (
    <div
      className={cn(
        'flex gap-3 border p-4 text-sm leading-6',
        tone === 'success'
          ? 'border-border bg-muted text-foreground'
          : tone === 'error'
            ? 'border-destructive/35 bg-destructive/5 text-destructive'
            : 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}
