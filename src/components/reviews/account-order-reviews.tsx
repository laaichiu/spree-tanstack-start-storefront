import { CheckCircle, MessageSquareText } from 'lucide-react'
import { useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { Button } from '@/components/ui/button'

import { ProductReviewForm } from './product-review-form'

export type ReviewableOrderItem = {
  id: string
  imageUrl: string | null
  name: string
  optionsText: string
  productId: string
  variantId: string
}

export function AccountOrderReviews({
  items,
  orderId,
}: {
  items: ReviewableOrderItem[]
  orderId: string
}) {
  const { t } = useMarket()
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [submittedItemIds, setSubmittedItemIds] = useState<Set<string>>(
    () => new Set(),
  )
  const reviewableItems = items.filter(
    (item) => item.productId && item.variantId,
  )

  if (!reviewableItems.length) {
    return null
  }

  return (
    <section className="border border-border bg-background p-5 sm:p-6">
      <div className="flex gap-3">
        <MessageSquareText
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
        />
        <div>
          <h2 className="text-lg font-normal text-foreground">
            {t('reviews.orderReviewsTitle')}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t('reviews.orderReviewsDescription')}
          </p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {reviewableItems.map((item) => {
          const active = activeItemId === item.id
          const submitted = submittedItemIds.has(item.id)

          return (
            <li className="py-5" key={item.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-16 w-16 shrink-0 overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    <img
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      src={item.imageUrl}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-normal text-foreground">{item.name}</h3>
                  {item.optionsText ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.optionsText}
                    </p>
                  ) : null}
                </div>
                {submitted ? (
                  <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle aria-hidden="true" className="h-4 w-4" />
                    {t('reviews.submitted')}
                  </p>
                ) : (
                  <Button
                    onClick={() => setActiveItemId(active ? null : item.id)}
                    size="sm"
                    variant={active ? 'ghost' : 'secondary'}
                  >
                    {active ? t('reviews.cancel') : t('reviews.writeReview')}
                  </Button>
                )}
              </div>

              {active && !submitted ? (
                <ProductReviewForm
                  item={item}
                  onCancel={() => setActiveItemId(null)}
                  onSubmitted={() =>
                    setSubmittedItemIds((current) =>
                      new Set(current).add(item.id),
                    )
                  }
                  orderId={orderId}
                />
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
