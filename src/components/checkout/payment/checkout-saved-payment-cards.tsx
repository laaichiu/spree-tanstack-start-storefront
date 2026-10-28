import { useMarket } from '@/components/layout/market-provider'
import { getCheckoutSavedPaymentCardOptionDisplays } from '@/components/checkout/payment/checkout-saved-payment-card-display'
import type { CheckoutSavedPaymentCard } from '@/lib/checkout/contracts'
import { CheckoutSavedPaymentCardsView } from '@/components/checkout/checkout-saved-payment-cards-view'

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
    <CheckoutSavedPaymentCardsView
      model={{
        addNewLabel: t('checkout.addNewPaymentMethod'),
        cards: getCheckoutSavedPaymentCardOptionDisplays({
          cardEndingIn: t('account.cardEndingIn'),
          cardExpires: t('account.cardExpires'),
          cards,
        }),
        defaultLabel: t('account.defaultPaymentMethod'),
        disabled,
        selectedPaymentProfileId,
        title: t('checkout.savedPaymentMethods'),
      }}
      onSavedPaymentProfileChange={onSavedPaymentProfileChange}
    />
  )
}
