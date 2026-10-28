import type { ReactNode } from 'react'

import type { OrderLineItemDisplay } from './account-order-line-item-display'
import type { AccountOrderItemsModel } from '@/components/contracts/account'
import { ProductImageFallbackView } from '@/components/shared/product-image-fallback-view'
import { AccountSectionHeader, AccountSurface } from './account-ui-view'

export type {
  AccountOrderItemsLabels,
  AccountOrderItemsModel,
} from '@/components/contracts/account'

export function AccountOrderItemsView({
  model,
  renderProductLink,
}: {
  model: AccountOrderItemsModel
  renderProductLink: (
    item: OrderLineItemDisplay,
    props: { children: ReactNode; className: string },
  ) => ReactNode
}) {
  const { items, labels } = model

  return (
    <AccountSurface>
      <AccountSectionHeader
        description={labels.orderItemsDescription}
        title={labels.orderItems}
      />
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li
            className="flex flex-col gap-5 border border-border bg-muted p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-5"
            key={item.id}
          >
            <div className="h-28 w-28 shrink-0 overflow-hidden bg-background">
              {item.imageUrl ? (
                <img
                  alt={item.name}
                  className="h-full w-full object-cover"
                  src={item.imageUrl}
                />
              ) : (
                <ProductImageFallbackView
                  label={labels.noImage}
                  variant="compact"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs font-normal text-foreground">
                {item.slug
                  ? renderProductLink(item, {
                      children: item.name,
                      className:
                        'transition-colors hover:text-muted-foreground',
                    })
                  : item.name}
              </h2>
              {item.optionsText && (
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {item.optionsText}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs leading-6 text-muted-foreground">
                <span className="inline-flex border border-border bg-background px-2.5 py-1">
                  {labels.quantity} {item.quantity}
                </span>
                <span className="inline-flex border border-border bg-background px-2.5 py-1">
                  {labels.each} {item.displayPrice}
                </span>
              </div>
            </div>
            <div className="sm:w-32 sm:text-right">
              <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
                {labels.lineTotal}
              </p>
              <p className="mt-2 text-xl font-normal text-foreground">
                {item.displayTotal}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </AccountSurface>
  )
}
