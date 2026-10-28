import type { Ref } from 'react'

import type { CheckoutBillingAddressFieldsSlots } from '../contracts/checkout'

export type { CheckoutBillingAddressFieldsSlots } from '../contracts/checkout'

export function CheckoutBillingAddressFieldsView({
  fieldsRef,
  onAutofillSync,
  slots,
}: {
  fieldsRef?: Ref<HTMLDivElement>
  onAutofillSync?: () => void
  slots: CheckoutBillingAddressFieldsSlots
}) {
  return (
    <div
      className="-mt-4 space-y-4 border-x border-b border-border px-4 pt-5 pb-4"
      id="checkout-billing-address-fields"
      onClickCapture={onAutofillSync}
      onFocusCapture={onAutofillSync}
      onPointerDownCapture={onAutofillSync}
      ref={fieldsRef}
    >
      {slots.fields}
    </div>
  )
}
