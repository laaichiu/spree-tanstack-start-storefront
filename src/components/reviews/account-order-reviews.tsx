import { useState } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import { AccountOrderReviewsView } from '@/components/account/account-order-reviews-view'
import {
  useAccountSession,
  useAccountSessionRequiredRedirect,
} from '@/lib/account/client/account-session-provider'

import { ProductReviewForm } from './product-review-form'
import type { OrderReviewItem } from './order-review-items'

export function AccountOrderReviews({
  items,
  orderId,
}: {
  items: OrderReviewItem[]
  orderId: string
}) {
  const customer = useAccountSession()
  const { market } = useMarket()
  const lifecycleKey = `${customer.id}:${market.country}:${market.locale}:${orderId}`

  return (
    <AccountOrderReviewsState
      items={items}
      key={lifecycleKey}
      orderId={orderId}
    />
  )
}

function AccountOrderReviewsState({
  items,
  orderId,
}: {
  items: OrderReviewItem[]
  orderId: string
}) {
  const { t } = useMarket()
  const onSessionRequired = useAccountSessionRequiredRedirect()
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [submittedItemIds, setSubmittedItemIds] = useState<Set<string>>(
    () => new Set(),
  )
  if (!items.length) {
    return null
  }

  return (
    <AccountOrderReviewsView
      model={{
        items: items.map((item) => ({
          id: item.id,
          imageUrl: item.imageUrl,
          name: item.name,
          optionsText: item.optionsText,
          active: activeItemId === item.id,
          submitted: submittedItemIds.has(item.id),
        })),
        labels: {
          cancel: t('reviews.cancel'),
          description: t('reviews.orderReviewsDescription'),
          submitted: t('reviews.submitted'),
          title: t('reviews.orderReviewsTitle'),
          writeReview: t('reviews.writeReview'),
        },
      }}
      onToggleItem={(itemId) =>
        setActiveItemId((current) => (current === itemId ? null : itemId))
      }
      renderReviewForm={(itemId) => {
        const item = items.find((candidate) => candidate.id === itemId)

        if (!item) {
          return null
        }

        return (
          <ProductReviewForm
            item={item}
            key={`${item.id}:${item.productId}:${item.variantId}`}
            onCancel={() => setActiveItemId(null)}
            onSubmitted={() =>
              setSubmittedItemIds((current) => new Set(current).add(item.id))
            }
            onSessionRequired={onSessionRequired}
            orderId={orderId}
          />
        )
      }}
    />
  )
}
