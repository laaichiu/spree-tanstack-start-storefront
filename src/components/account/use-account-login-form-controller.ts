import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { useMarket } from '@/components/layout/market-provider'
import { useCustomerLogin } from '@/lib/account/client/use-customer-login'
import { customerLoginSchema } from '@/lib/account/validation/login'
import type { CustomerLoginInput } from '@/lib/account/validation/login'

export function useAccountLoginFormController({
  redirectTo,
}: {
  redirectTo: string
}) {
  const { market } = useMarket()
  const router = useRouter()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CustomerLoginInput>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(customerLoginSchema),
  })
  const loginMutation = useCustomerLogin({
    market: { country: market.country, locale: market.locale },
    onLoggedIn: async () => {
      await router.invalidate()
      await router.navigate({
        href: redirectTo,
      })
    },
  })

  return {
    form: {
      errors,
      register,
      submit: handleSubmit((data) => loginMutation.submit(data)),
    },
    state: {
      isError: loginMutation.isError,
      isPending: loginMutation.isPending,
    },
  }
}
