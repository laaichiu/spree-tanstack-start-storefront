import { CreditCard } from 'lucide-react'

import { RadioGroup, RadioOption } from '@/components/ui/radio'
import { cn } from '@/components/ui/utils'

import type { CheckoutSavedPaymentCardsModel } from '../contracts/checkout'

export type { CheckoutSavedPaymentCardsModel } from '../contracts/checkout'

const ADD_NEW_PAYMENT_CARD_VALUE = '__new_payment_card__'

export function CheckoutSavedPaymentCardsView({
  model,
  onSavedPaymentProfileChange,
}: {
  model: CheckoutSavedPaymentCardsModel
  onSavedPaymentProfileChange: (paymentProfileId: string | null) => void
}) {
  if (model.cards.length === 0) {
    return null
  }

  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
        {model.title}
      </p>
      <RadioGroup
        className="space-y-0 overflow-hidden border border-border bg-background"
        disabled={model.disabled}
        onValueChange={(value) => {
          if (typeof value !== 'string') {
            return
          }

          onSavedPaymentProfileChange(
            value === ADD_NEW_PAYMENT_CARD_VALUE ? null : value,
          )
        }}
        value={model.selectedPaymentProfileId ?? ADD_NEW_PAYMENT_CARD_VALUE}
      >
        {model.cards.map((card, index) => (
          <RadioOption
            className={cn('px-4 py-3', index > 0 && 'border-t border-border')}
            description={card.description}
            key={card.value}
            label={card.label}
            trailing={
              card.isDefault && (
                <span className="text-xs leading-4 font-normal uppercase text-muted-foreground">
                  {model.defaultLabel}
                </span>
              )
            }
            value={card.value}
          />
        ))}
        <RadioOption
          className="border-t border-border px-4 py-3"
          label={
            <span className="inline-flex items-center gap-2">
              <CreditCard aria-hidden="true" className="h-4 w-4" />
              {model.addNewLabel}
            </span>
          }
          value={ADD_NEW_PAYMENT_CARD_VALUE}
        />
      </RadioGroup>
    </div>
  )
}
