import type { ComponentPropsWithRef } from 'react'

import { Input } from '@/components/ui/input'
import type { CheckoutContactFieldModel } from '../contracts/checkout'
import {
  themeCheckoutFieldClassName,
  themeCheckoutLabelClassName,
} from './checkout-field-styles'

export type { CheckoutContactFieldModel } from '../contracts/checkout'

export type CheckoutContactFieldBinding = Pick<
  ComponentPropsWithRef<'input'>,
  'name' | 'onBlur' | 'onChange' | 'ref'
>

export function CheckoutContactFieldView({
  fieldProps,
  model,
}: {
  fieldProps: CheckoutContactFieldBinding
  model: CheckoutContactFieldModel
}) {
  return (
    <Input
      className={themeCheckoutFieldClassName}
      disabled={model.disabled}
      error={model.error}
      label={model.label}
      labelClassName={themeCheckoutLabelClassName}
      placeholder={model.placeholder}
      type="email"
      {...fieldProps}
    />
  )
}
