import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'

import { useMarket } from '@/components/layout/market-provider'
import { useCustomerPasswordResetConfirmation } from '@/lib/account/client/use-customer-password-reset-confirmation'
import { customerPasswordResetConfirmSchema } from '@/lib/account/validation/password-reset'
import type { CustomerPasswordResetConfirmInput } from '@/lib/account/validation/password-reset'

export function useAccountResetPasswordFormController({
  token,
}: {
  token: string
}) {
  const { market } = useMarket()
  const router = useRouter()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CustomerPasswordResetConfirmInput>({
    defaultValues: {
      password: '',
      passwordConfirmation: '',
      token,
    },
    resolver: zodResolver(customerPasswordResetConfirmSchema),
  })
  const resetMutation = useCustomerPasswordResetConfirmation({
    market: { country: market.country, locale: market.locale },
    onReset: async () => {
      await router.invalidate()
    },
  })

  return {
    form: {
      errors,
      register,
      submit: handleSubmit((data) => resetMutation.submit(data)),
    },
    state: {
      isError: resetMutation.isError,
      isPending: resetMutation.isPending,
      isSuccess: resetMutation.isSuccess,
    },
  }
}
