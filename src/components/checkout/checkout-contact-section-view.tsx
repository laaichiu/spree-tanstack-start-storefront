import type { ReactNode } from 'react'

import type { CheckoutContactSectionModel } from '../contracts/checkout'
import { CheckoutContactFieldView } from './checkout-contact-field-view'
import type { CheckoutContactFieldBinding } from './checkout-contact-field-view'
import { CheckoutSectionView } from './checkout-section-view'

export type { CheckoutContactSectionModel } from '../contracts/checkout'

export function CheckoutContactSectionView({
  action,
  fieldProps,
  model,
}: {
  action?: ReactNode
  fieldProps: CheckoutContactFieldBinding
  model: CheckoutContactSectionModel
}) {
  return (
    <CheckoutSectionView
      model={model.section}
      slots={{
        action,
        content: (
          <CheckoutContactFieldView
            fieldProps={fieldProps}
            model={model.contact}
          />
        ),
      }}
    />
  )
}
