import { useMarket } from '@/components/layout/market-provider'
import { CheckoutDeliveryFormView } from '@/components/checkout/checkout-delivery-form-view'
import { CheckoutDeliverySectionView } from '@/components/checkout/checkout-delivery-section-view'

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
    <CheckoutDeliveryFormView
      onBlurCapture={onBlurCapture}
      onChangeCapture={onChangeCapture}
      onClickCapture={onClickCapture}
      onFocusCapture={onFocusCapture}
      onInputCapture={onInputCapture}
      onPointerDownCapture={onPointerDownCapture}
      onSubmit={onSubmit}
      formRef={formRef}
      slots={{
        contact: <CheckoutContactSection {...contact} />,
        delivery: (
          <CheckoutDeliverySectionView
            model={{
              description: t('checkout.deliveryStepDescription'),
              id: 'checkout-section-delivery',
              title: t('checkout.deliveryStep'),
            }}
            slots={{
              address: <CheckoutDeliveryAddressFields {...address} />,
              shipping: <CheckoutShippingMethodSection {...shipping} />,
            }}
          />
        ),
      }}
    />
  )
}
