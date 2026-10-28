import type {
  OrderPlacedItemsCapabilities,
  OrderPlacedItemsModel,
} from '../contracts/checkout'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'

export type {
  OrderPlacedItemsCapabilities,
  OrderPlacedItemsModel,
} from '../contracts/checkout'

export function OrderPlacedItemsView({
  capabilities,
  model,
}: {
  capabilities: OrderPlacedItemsCapabilities
  model: OrderPlacedItemsModel
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-normal text-foreground">
          {model.title}
        </h2>
        <p className="text-xs leading-6 text-muted-foreground">
          {model.description}
        </p>
      </div>
      <ul className="divide-y divide-border border border-border">
        {model.items.map((item) => (
          <li className="flex gap-4 px-5 py-5" key={item.id}>
            {capabilities.renderProductLink(item, {
              children: (
                <span className="block h-full w-full overflow-hidden border border-border bg-muted">
                  {item.imageUrl ? (
                    <img
                      alt={item.imageAlt}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                      src={item.imageUrl}
                    />
                  ) : (
                    <ProductImageFallbackView
                      label={item.imageFallback}
                      variant="compact"
                    />
                  )}
                </span>
              ),
              className:
                'h-[4.875rem] w-16 shrink-0 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            })}
            <div className="min-w-0 flex-1 space-y-1">
              {capabilities.renderProductLink(item, {
                children: item.name,
                className:
                  'block text-xs leading-5 font-normal tracking-wider text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              })}
              {item.optionsText && (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.optionsText}
                </p>
              )}
              <p className="text-xs leading-5 text-muted-foreground">
                {item.quantityText}
              </p>
            </div>
            <div className="shrink-0 pt-0.5 text-right text-xs leading-5 font-normal text-foreground">
              {item.total}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
