import type {
  CheckoutSummaryLineItemsCapabilities,
  CheckoutSummaryLineItemsModel,
} from '../contracts/checkout'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'

export type {
  CheckoutSummaryLineItemsCapabilities,
  CheckoutSummaryLineItemsModel,
} from '../contracts/checkout'

export function CheckoutSummaryLineItemsView({
  capabilities,
  model,
}: {
  capabilities: CheckoutSummaryLineItemsCapabilities
  model: CheckoutSummaryLineItemsModel
}) {
  return (
    <ul className="space-y-5">
      {model.items.map((item) => (
        <li className="flex items-start gap-4" key={item.id}>
          {capabilities.renderProductLink(item, {
            children: (
              <>
                <span className="block h-full w-full overflow-hidden border border-border bg-muted">
                  {item.imageUrl ? (
                    <img
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      src={item.imageUrl}
                    />
                  ) : (
                    <ProductImageFallbackView
                      label={model.imageFallbackLabel}
                      variant="compact"
                    />
                  )}
                </span>
                <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground px-1 text-xs leading-none font-normal text-background">
                  {item.quantity}
                </span>
              </>
            ),
            className:
              'relative h-[4.875rem] w-16 shrink-0 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          })}

          <div className="min-w-0 flex-1">
            {capabilities.renderProductLink(item, {
              children: item.name,
              className:
                'block text-xs leading-5 tracking-wider text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            })}
            {item.optionsText && (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {item.optionsText}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5 pt-0.5 text-right text-xs leading-5 text-foreground">
            {item.compareAtPrice && (
              <span className="text-muted-foreground line-through">
                {item.compareAtPrice}
              </span>
            )}
            <span>{item.price}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
