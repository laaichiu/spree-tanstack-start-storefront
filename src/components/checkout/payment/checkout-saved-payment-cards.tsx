import { CreditCard } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { RadioGroup, RadioOption } from '@/components/ui/radio'
import {
  formatCustomerCreditCardBrand,
  formatCustomerCreditCardExpiry,
} from '@/lib/account/model/customer-credit-card'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/utils/payment/saved-payment-card'
import { cn } from '@/lib/utils'

const ADD_NEW_PAYMENT_CARD_VALUE = '__new_payment_card__'

export function CheckoutSavedPaymentCards({
  cards,
  disabled = false,
  onSavedPaymentProfileChange,
  selectedPaymentProfileId,
}: {
  cards: Array<CheckoutSavedPaymentCard>
  disabled?: boolean
  onSavedPaymentProfileChange: (paymentProfileId: string | null) => void
  selectedPaymentProfileId: string | null
}) {
  const { t } = useMarket()

  if (cards.length === 0) {
    return null
  }

  return (
    <div className="mb-4 space-y-2">
      <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
        {t('checkout.savedPaymentMethods')}
      </p>
      <RadioGroup
        className="space-y-0 overflow-hidden border border-border bg-background"
        disabled={disabled}
        onValueChange={(value) => {
          if (typeof value !== 'string') {
            return
          }

          onSavedPaymentProfileChange(
            value === ADD_NEW_PAYMENT_CARD_VALUE ? null : value,
          )
        }}
        value={selectedPaymentProfileId ?? ADD_NEW_PAYMENT_CARD_VALUE}
      >
        {cards.map((card, index) => (
          <RadioOption
            className={cn(
              'px-4 py-3',
              index > 0 ? 'border-t border-border' : null,
            )}
            description={`${t('account.cardExpires')} ${formatCustomerCreditCardExpiry(card)}`}
            key={card.id}
            label={
              <span>
                {formatCustomerCreditCardBrand(card.brand, 'CARD')}{' '}
                {t('account.cardEndingIn')} {card.last4}
              </span>
            }
            trailing={
              card.default ? (
                <span className="text-sm leading-4 font-normal uppercase text-muted-foreground">
                  {t('account.defaultPaymentMethod')}
                </span>
              ) : null
            }
            value={card.gatewayPaymentProfileId}
          />
        ))}
        <RadioOption
          className="border-t border-border px-4 py-3"
          label={
            <span className="inline-flex items-center gap-2">
              <CreditCard aria-hidden="true" className="h-4 w-4" />
              {t('checkout.addNewPaymentMethod')}
            </span>
          }
          value={ADD_NEW_PAYMENT_CARD_VALUE}
        />
      </RadioGroup>
    </div>
  )
}
