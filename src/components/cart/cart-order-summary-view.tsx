import { buttonClassName } from '@/components/ui/button'
import type {
  CartLinkRenderer,
  CartOrderSummaryModel,
  CartPolicyLinkRenderer,
} from '@/components/contracts/cart'

type CartOrderSummaryViewProps = {
  model: CartOrderSummaryModel
  renderCheckoutLink: CartLinkRenderer
  renderContinueShoppingLink: CartLinkRenderer
  renderPolicyLink: CartPolicyLinkRenderer
}

export function CartOrderSummaryView({
  model,
  renderCheckoutLink,
  renderContinueShoppingLink,
  renderPolicyLink,
}: CartOrderSummaryViewProps) {
  const { labels } = model

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <section className="border border-border bg-background p-6 sm:p-7">
        <p className="text-xs leading-4 font-normal uppercase text-foreground">
          {labels.orderSummary}
        </p>

        <div className="mt-5 space-y-3 text-xs leading-6 text-muted-foreground">
          <div className="flex items-center justify-between gap-4">
            <span>{labels.subtotal}</span>
            {model.itemTotal}
          </div>
          {model.discount && (
            <div className="flex items-center justify-between gap-4 text-foreground">
              <span>{labels.discount}</span>
              {model.discount}
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <span>{labels.shipping}</span>
            <div className="text-right">
              {model.shipping ?? labels.shippingCalculatedAtCheckout}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>{labels.tax}</span>
            <div className="text-right">
              {model.tax ?? labels.shippingCalculatedAtCheckout}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs leading-4 font-normal uppercase text-foreground">
              {labels.total}
            </span>
            {model.total}
          </div>
        </div>

        {renderCheckoutLink(
          labels.proceedToCheckout,
          buttonClassName({
            className: 'mt-7 min-h-12 w-full',
            size: 'lg',
          }),
        )}
        {renderContinueShoppingLink(
          labels.continueShopping,
          'mt-3 inline-flex w-full justify-center text-center text-xs tracking-wider text-muted-foreground uppercase underline decoration-border underline-offset-4 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        )}

        <div className="mt-7 border-t border-border pt-5">
          <p className="text-xs leading-6 text-muted-foreground">
            {labels.shippingNote}
          </p>
          <div className="mt-4 grid gap-3 text-xs tracking-wider text-foreground uppercase sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {renderPolicyLink(
              'shipping-policy',
              labels.shippingPolicy,
              'underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
            {renderPolicyLink(
              'returns-policy',
              labels.returnPolicy,
              'underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
          </div>
        </div>
      </section>
    </aside>
  )
}
