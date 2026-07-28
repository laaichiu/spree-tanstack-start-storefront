import { useMarket } from '@/components/layout/market-provider'

import { CheckoutSection } from '../checkout-section'
import { CheckoutContactSection } from './checkout-contact-section'
import { CheckoutDeliveryAddressFields } from './checkout-delivery-address-fields'
import type { CheckoutDeliverySectionProps } from './checkout-delivery-section.types'
import { CheckoutShippingMethodSection } from '../shipping/checkout-shipping-method-section'

export function CheckoutDeliverySection({
  address,
  contact,
  formRef,
  onBlurCapture,
  onChangeCapture,
  onClickCapture,
  onFocusCapture,
  onInputCapture,
  onPointerDownCapture,
  onSubmit,
  shipping,
}: CheckoutDeliverySectionProps) {
  const { t } = useMarket()

  return (
    <form
      className="space-y-8"
      onBlurCapture={onBlurCapture}
      onChangeCapture={onChangeCapture}
      onClickCapture={onClickCapture}
      onFocusCapture={onFocusCapture}
      onInputCapture={onInputCapture}
      onPointerDownCapture={onPointerDownCapture}
      onSubmit={onSubmit}
      ref={formRef}
    >
      <CheckoutContactSection {...contact} />

      <CheckoutSection
        description={t('checkout.deliveryStepDescription')}
        id="checkout-section-delivery"
        title={t('checkout.deliveryStep')}
      >
        <CheckoutDeliveryAddressFields {...address} />
        <CheckoutShippingMethodSection {...shipping} />
      </CheckoutSection>
    </form>
  )
}
