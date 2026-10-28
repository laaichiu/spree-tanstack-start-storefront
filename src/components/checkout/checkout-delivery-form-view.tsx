import type { ComponentPropsWithoutRef, Ref } from 'react'

import type { CheckoutDeliveryFormSlots } from '../contracts/checkout'

export type { CheckoutDeliveryFormSlots } from '../contracts/checkout'

type CheckoutDeliveryFormEvents = Pick<
  ComponentPropsWithoutRef<'form'>,
  | 'onBlurCapture'
  | 'onChangeCapture'
  | 'onClickCapture'
  | 'onFocusCapture'
  | 'onInputCapture'
  | 'onPointerDownCapture'
  | 'onSubmit'
>

export function CheckoutDeliveryFormView({
  formRef,
  slots,
  ...events
}: CheckoutDeliveryFormEvents & {
  formRef?: Ref<HTMLFormElement>
  slots: CheckoutDeliveryFormSlots
}) {
  return (
    <form className="space-y-8" ref={formRef} {...events}>
      {slots.contact}
      {slots.delivery}
    </form>
  )
}
