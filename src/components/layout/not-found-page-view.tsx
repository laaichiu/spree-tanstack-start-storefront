import { Link } from '@tanstack/react-router'

import { DEFAULT_PRODUCT_LISTING_SEARCH } from '@/lib/catalog/contracts'
import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import type { NotFoundPageModel } from '../contracts/layout'

export type { NotFoundPageModel } from '../contracts/layout'

export function NotFoundPageView({
  className,
  marketParams,
  model,
}: {
  className?: string
  marketParams: { country: string; locale: string }
  model: NotFoundPageModel
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
            <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
              {model.eyebrow}
            </p>
            <h1 className="text-2xl leading-tight md:text-3xl break-words font-normal text-foreground">
              {model.title}
            </h1>
            <p className="mx-auto max-w-md text-xs leading-6 text-muted-foreground">
              {model.description}
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className={buttonClassName({
                className: 'min-h-12 min-w-52 px-8',
                size: 'lg',
              })}
              params={marketParams}
              to="/$country/$locale"
            >
              {model.primaryLabel}
            </Link>
            {model.secondaryLabel && (
              <Link
                className={buttonClassName({
                  className: 'min-h-12 min-w-52 px-8',
                  size: 'lg',
                  variant: 'secondary',
                })}
                params={marketParams}
                search={DEFAULT_PRODUCT_LISTING_SEARCH}
                to="/$country/$locale/products"
              >
                {model.secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
