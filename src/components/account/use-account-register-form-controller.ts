import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useController, useForm } from 'react-hook-form'

import { useMarket } from '@/components/layout/market-provider'
import { useCustomerRegistration } from '@/lib/account/client/use-customer-registration'
import { customerRegisterSchema } from '@/lib/account/validation/register'
import type { CustomerRegisterInput } from '@/lib/account/validation/register'

export function useAccountRegisterFormController() {
  const { market } = useMarket()
  const router = useRouter()
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CustomerRegisterInput>({
    defaultValues: {
      acceptsEmailMarketing: false,
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordConfirmation: '',
    },
    resolver: zodResolver(customerRegisterSchema),
  })
  const { field: marketingField } = useController({
    control,
    name: 'acceptsEmailMarketing',
  })
  const registerMutation = useCustomerRegistration({
    market: { country: market.country, locale: market.locale },
    onRegistered: async () => {
      await router.invalidate()
      await router.navigate({
        params: { country: market.country, locale: market.locale },
        to: '/$country/$locale/account',
      })
    },
  })

  return {
    form: {
      errors,
      marketingField,
      register,
      submit: handleSubmit((data) => registerMutation.submit(data)),
    },
    state: {
      isError: registerMutation.isError,
      isPending: registerMutation.isPending,
    },
  }
}
