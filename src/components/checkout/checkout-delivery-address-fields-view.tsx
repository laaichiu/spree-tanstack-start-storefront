import type {
  CheckoutDeliveryAddressFieldsModel,
  CheckoutDeliveryAddressFieldsSlots,
} from '../contracts/checkout'

export type {
  CheckoutDeliveryAddressFieldsModel,
  CheckoutDeliveryAddressFieldsSlots,
} from '../contracts/checkout'

export function CheckoutDeliveryAddressFieldsView({
  model,
  slots,
}: {
  model: CheckoutDeliveryAddressFieldsModel
  slots: CheckoutDeliveryAddressFieldsSlots
}) {
  return (
    <>
      {slots.saved}
      {model.showManualAddressForm && slots.manual}
    </>
  )
}
