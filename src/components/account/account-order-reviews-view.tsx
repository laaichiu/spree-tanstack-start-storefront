import { CheckCircle, MessageSquareText } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { AccountOrderReviewsProps } from '@/components/contracts/account'

export type {
  AccountOrderReviewItem,
  AccountOrderReviewsLabels,
  AccountOrderReviewsModel,
  AccountOrderReviewsProps,
} from '@/components/contracts/account'

export function AccountOrderReviewsView({
  model,
  onToggleItem,
  renderReviewForm,
}: AccountOrderReviewsProps) {
  const { items, labels } = model

  return (
    <section className="border border-border bg-background p-5 sm:p-6">
      <div className="flex gap-3">
        <MessageSquareText
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
        />
        <div>
          <h2 className="text-lg md:text-xl font-normal text-foreground">
            {labels.title}
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            {labels.description}
          </p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-border border-t border-border">
        {items.map((item) => (
          <li className="py-5" key={item.id}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-16 w-16 shrink-0 overflow-hidden bg-muted">
                {item.imageUrl && (
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={item.imageUrl}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-normal text-foreground">
                  {item.name}
                </h3>
                {item.optionsText && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.optionsText}
                  </p>
                )}
              </div>
              {item.submitted ? (
                <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle aria-hidden="true" className="h-4 w-4" />
                  {labels.submitted}
                </p>
              ) : (
                <Button
                  onClick={() => onToggleItem(item.id)}
                  size="sm"
                  variant={item.active ? 'ghost' : 'secondary'}
                >
                  {item.active ? labels.cancel : labels.writeReview}
                </Button>
              )}
            </div>

            {item.active && !item.submitted && renderReviewForm(item.id)}
          </li>
        ))}
      </ul>
    </section>
  )
}
