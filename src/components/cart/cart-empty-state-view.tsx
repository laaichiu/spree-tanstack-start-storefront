import { buttonClassName } from '@/components/ui/button'

import type {
  CartEmptyStateModel,
  CartLinkRenderer,
} from '@/components/contracts/cart'

export function CartEmptyStateView({
  model,
  renderPolicyLink,
  renderShopLink,
}: {
  model: CartEmptyStateModel
  renderPolicyLink: CartLinkRenderer
  renderShopLink: CartLinkRenderer
}) {
  return (
    <section className="w-full px-4 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-3xl border-y border-border py-16 text-center sm:py-24">
        <h1 className="text-2xl leading-tight md:text-3xl break-words font-normal text-foreground">
          {model.title}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {renderShopLink(
            model.shopLabel,
            buttonClassName({
              className: 'min-h-12 min-w-56 px-8',
              size: 'lg',
            }),
          )}
          {renderPolicyLink(
            model.policyLabel,
            'text-xs tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        </div>
      </div>
    </section>
  )
}
