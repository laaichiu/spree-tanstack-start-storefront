import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { useCustomerPasswordReset } from '@/lib/account/client/use-customer-password-reset'
import { AccountAuthFormView } from '@/components/account/account-auth-form-view'
import { AccountAuthMessageView } from '@/components/account/account-auth-message-view'
import { AccountAuthSubmitButtonView } from '@/components/account/account-auth-submit-button-view'
import { AccountEmailFieldView } from '@/components/account/account-email-field-view'
import { useMarket } from '@/components/layout/market-provider'
import { customerPasswordResetSchema } from '@/lib/account/validation/password-reset'
import type { CustomerPasswordResetInput } from '@/lib/account/validation/password-reset'

export function AccountPasswordResetForm() {
  const { market, t } = useMarket()
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
  const passwordResetMutation = useCustomerPasswordReset({
    market: { country: market.country, locale: market.locale },
  })
  const handlePasswordResetSubmit = handleSubmit((data) =>
    passwordResetMutation.submit(data),
  )

  return (
    <AccountAuthFormView onSubmit={handlePasswordResetSubmit}>
      {passwordResetMutation.isError && (
        <AccountAuthMessageView
          message={t('account.passwordResetUnavailableMessage')}
          tone="error"
        />
      )}

      {passwordResetMutation.isSuccess && (
        <AccountAuthMessageView
          message={t('account.passwordResetSent')}
          tone="success"
        />
      )}

      <AccountEmailFieldView
        {...register('email')}
        autoComplete="email"
        disabled={passwordResetMutation.isPending}
        error={errors.email?.message && t('account.invalidEmail')}
        inputMode="email"
        label={t('account.email')}
        placeholder={t('account.emailPlaceholder')}
        type="email"
      />

      <AccountAuthSubmitButtonView
        disabled={passwordResetMutation.isPending}
        label={
          passwordResetMutation.isPending
            ? t('account.sendingResetLink')
            : t('account.sendResetLink')
        }
      />
    </AccountAuthFormView>
  )
}
