import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { getCustomerAddressFormDefaults } from '@/lib/account/contracts'
import type { CustomerAddress } from '@/lib/account/contracts'
import type { CustomerAddressInput } from '@/lib/account/validation/address'
import { customerAddressSchema } from '@/lib/account/validation/address'

export function useAccountAddressFormController({
  address,
  fallbackCountry,
  onSubmit,
}: {
  address: CustomerAddress | null
  fallbackCountry: string
  onSubmit: (values: CustomerAddressInput) => void
}) {
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<CustomerAddressInput>({
    defaultValues: getCustomerAddressFormDefaults({ address, fallbackCountry }),
    resolver: zodResolver(customerAddressSchema),
  })

  useEffect(() => {
    reset(getCustomerAddressFormDefaults({ address, fallbackCountry }))
  }, [address, fallbackCountry, reset])

  return {
    control,
    errors,
    register,
    setValue,
    submit: handleSubmit(onSubmit),
  }
}
