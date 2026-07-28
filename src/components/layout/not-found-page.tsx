import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NotFoundPage({
  className,
  description,
  eyebrow,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  title,
}: {
  className?: string
  description: string
  eyebrow: string
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
  title: string
}) {
  return (
    <>
      <meta content="noindex, nofollow" name="robots" />
      <section
        className={cn(
          'mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-checkout items-center px-6 py-12 lg:px-14',
          className,
        )}
      >
        <div className="w-full space-y-7 text-center">
          <div className="space-y-4">
            <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="text-3xl leading-tight font-normal text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-6 mx-auto max-w-md text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <a
              className={buttonClassName({
                className: 'min-h-12 min-w-52 px-8',
                size: 'lg',
              })}
              href={primaryHref}
            >
              {primaryLabel}
            </a>
            {secondaryHref && secondaryLabel ? (
              <a
                className={buttonClassName({
                  className: 'min-h-12 min-w-52 px-8',
                  size: 'lg',
                  variant: 'secondary',
                })}
                href={secondaryHref}
              >
                {secondaryLabel}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  )
}
