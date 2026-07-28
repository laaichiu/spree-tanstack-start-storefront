import type { ReactNode } from 'react'

export function CheckoutSection({
  action,
  children,
  description,
  errors,
  id,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  description?: string
  errors?: string[]
  id?: string
  title: string
}) {
  return (
    <section className="space-y-5 scroll-mt-8" id={id}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl leading-none font-normal text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {errors?.length ? (
        <div className="border border-destructive bg-muted px-4 py-3">
          {errors.map((error, index) => (
            <p
              className="text-sm leading-6 text-destructive"
              key={`${error}:${index}`}
            >
              {error}
            </p>
          ))}
        </div>
      ) : null}
      {children}
    </section>
  )
}
