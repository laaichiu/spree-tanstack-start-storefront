import type { ComponentProps, ReactNode } from 'react'

import { Input } from '@/components/ui/input'

import { CheckoutPostalAddressLayoutView } from './checkout-postal-address-layout-view'

type PostalAddressInputProps = ComponentProps<typeof Input>

export type CheckoutPostalAddressFieldsModel = {
  address1: PostalAddressInputProps
  address2: PostalAddressInputProps
  city: PostalAddressInputProps
  company: PostalAddressInputProps
  country: ReactNode
  firstName: PostalAddressInputProps
  lastName: PostalAddressInputProps
  phone: PostalAddressInputProps
  postalCode: PostalAddressInputProps
  state: ReactNode
}

export function CheckoutPostalAddressFieldsView({
  model,
}: {
  model: CheckoutPostalAddressFieldsModel
}) {
  return (
    <CheckoutPostalAddressLayoutView
      slots={{
        address1: <Input {...model.address1} />,
        address2: <Input {...model.address2} />,
        city: <Input {...model.city} />,
        company: <Input {...model.company} />,
        country: model.country,
        firstName: <Input {...model.firstName} />,
        lastName: <Input {...model.lastName} />,
        phone: <Input {...model.phone} />,
        postalCode: <Input {...model.postalCode} />,
        state: model.state,
      }}
    />
  )
}
