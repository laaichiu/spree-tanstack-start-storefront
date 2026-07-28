import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { CircleAlert, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestCustomerPasswordReset } from '@/lib/account/api/account.functions'
import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { customerPasswordResetSchema } from '@/lib/account/validation/password-reset'
import type { CustomerPasswordResetInput } from '@/lib/account/validation/password-reset'

export function AccountPasswordResetForm() {
  const { t } = useMarket()
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<CustomerPasswordResetInput>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(customerPasswordResetSchema),
  })
  const passwordResetMutation = useMutation({
    mutationFn: (data: CustomerPasswordResetInput) =>
      requestCustomerPasswordReset({ data }),
  })
  const handlePasswordResetSubmit = handleSubmit((data) =>
    passwordResetMutation.mutate(data),
  )

  return (
    <form className="space-y-5" onSubmit={handlePasswordResetSubmit}>
      {passwordResetMutation.isError ? (
        <div className="flex gap-3 border border-destructive bg-muted px-4 py-3 text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm leading-6">
            {t('account.passwordResetUnavailableMessage')}
          </p>
        </div>
      ) : null}

      {passwordResetMutation.isSuccess ? (
        <div className="flex gap-3 border border-border bg-muted px-4 py-3 text-foreground">
          <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm leading-6">{t('account.passwordResetSent')}</p>
        </div>
      ) : null}

      <Input
        autoComplete="email"
        className={accountAuthInputClassName}
        disabled={passwordResetMutation.isPending}
        error={errors.email?.message ? t('account.invalidEmail') : null}
        inputMode="email"
        label={t('account.email')}
        labelClassName={accountAuthLabelClassName}
        leadingIcon={<Mail aria-hidden="true" className="h-4 w-4" />}
        placeholder={t('account.emailPlaceholder')}
        type="email"
        {...register('email')}
      />

      <Button
        className="h-12 w-full"
        disabled={passwordResetMutation.isPending}
        size="lg"
        type="submit"
      >
        {passwordResetMutation.isPending
          ? t('account.sendingResetLink')
          : t('account.sendResetLink')}
      </Button>
    </form>
  )
}
