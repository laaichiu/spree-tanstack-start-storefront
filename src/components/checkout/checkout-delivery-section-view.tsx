import type {
  CheckoutSectionModel,
  CheckoutDeliverySectionSlots,
} from '../contracts/checkout'
import { CheckoutSectionView } from './checkout-section-view'

export type { CheckoutDeliverySectionSlots } from '../contracts/checkout'

export function CheckoutDeliverySectionView({
  model,
  slots,
}: {
  model: CheckoutSectionModel
  slots: CheckoutDeliverySectionSlots
}) {
  return (
    <CheckoutSectionView
      model={model}
      slots={{
        content: (
          <>
            {slots.address}
            {slots.shipping}
          </>
        ),
      }}
    />
  )
}
