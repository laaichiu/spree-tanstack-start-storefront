import type { ReactNode } from 'react'

import type { AccountAuthShellModel } from '@/components/contracts/account'

export type { AccountAuthShellModel } from '@/components/contracts/account'

export function AccountAuthShellView({
  children,
  footer,
  model,
  supportingContent,
}: {
  children: ReactNode
  footer?: ReactNode
  model: AccountAuthShellModel
  supportingContent?: ReactNode
}) {
  return (
    <section className="mx-auto flex min-h-160 w-full max-w-304 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-160 border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8 lg:p-10">
        <div className="text-center">
          {model.label && (
            <p className="text-xs tracking-wider text-muted-foreground uppercase">
              {model.label}
            </p>
          )}
          <h1
            className={`text-2xl leading-tight md:text-3xl break-words font-normal tracking-wider text-foreground ${model.label ? 'mt-4' : ''}`}
          >
            {model.title}
          </h1>
          {model.description && (
            <div className="mx-auto mt-4 max-w-md text-xs leading-7 text-muted-foreground">
              {model.description}
            </div>
          )}
          {supportingContent && (
            <div className="mx-auto mt-3 max-w-md text-xs leading-7 text-muted-foreground">
              {supportingContent}
            </div>
          )}
        </div>

        <div className="mt-10">{children}</div>

        {footer && (
          <div className="mt-6 text-center text-xs leading-6 text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </section>
  )
}
