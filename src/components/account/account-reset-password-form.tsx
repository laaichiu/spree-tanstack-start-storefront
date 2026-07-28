import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import {
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetCustomerPassword } from '@/lib/account/api/account.functions'
import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
  accountInlineLinkClassName,
} from '@/components/account/account-ui'
import { customerPasswordResetConfirmSchema } from '@/lib/account/validation/password-reset'
import type { CustomerPasswordResetConfirmInput } from '@/lib/account/validation/password-reset'
import { useMarket } from '@/components/layout/market-provider'

export function AccountResetPasswordForm({ token }: { token: string }) {
  const { market, t } = useMarket()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false)
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
  const resetMutation = useMutation({
    mutationFn: (data: CustomerPasswordResetConfirmInput) =>
      resetCustomerPassword({ data }),
    onSuccess: async () => {
      await router.invalidate()
    },
  })
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const handleResetSubmit = handleSubmit((data) => resetMutation.mutate(data))

  if (resetMutation.isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border text-foreground">
          <CircleCheck aria-hidden="true" className="h-5 w-5" />
        </div>
        <p className="text-sm leading-6 mx-auto max-w-md text-muted-foreground">
          {t('account.passwordResetSuccessDescription')}
        </p>
        <Link
          className={accountInlineLinkClassName}
          params={marketParams}
          to="/$country/$locale/account/login"
        >
          {t('account.signIn')}
        </Link>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={handleResetSubmit}>
      {resetMutation.isError ? (
        <div className="flex gap-3 border border-destructive bg-muted px-4 py-3 text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm leading-6">
            {t('account.passwordResetUnavailableMessage')}
          </p>
        </div>
      ) : null}

      <input type="hidden" {...register('token')} />

      <Input
        autoComplete="new-password"
        className={accountAuthInputClassName}
        disabled={resetMutation.isPending}
        error={errors.password?.message ? t('account.passwordMinLength') : null}
        label={t('account.newPassword')}
        labelClassName={accountAuthLabelClassName}
        leadingIcon={<LockKeyhole aria-hidden="true" className="h-4 w-4" />}
        trailingSlot={
          <button
            aria-label={
              showPassword
                ? t('account.hidePassword')
                : t('account.showPassword')
            }
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition hover:text-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={resetMutation.isPending}
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        }
        type={showPassword ? 'text' : 'password'}
        {...register('password')}
      />

      <Input
        autoComplete="new-password"
        className={accountAuthInputClassName}
        disabled={resetMutation.isPending}
        error={
          errors.passwordConfirmation?.message
            ? t('account.passwordsDoNotMatch')
            : null
        }
        label={t('account.confirmPassword')}
        labelClassName={accountAuthLabelClassName}
        leadingIcon={<LockKeyhole aria-hidden="true" className="h-4 w-4" />}
        trailingSlot={
          <button
            aria-label={
              showPasswordConfirmation
                ? t('account.hidePassword')
                : t('account.showPassword')
            }
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition hover:text-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={resetMutation.isPending}
            onClick={() => setShowPasswordConfirmation((value) => !value)}
            type="button"
          >
            {showPasswordConfirmation ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        }
        type={showPasswordConfirmation ? 'text' : 'password'}
        {...register('passwordConfirmation')}
      />

      <Button
        className="h-12 w-full"
        disabled={resetMutation.isPending}
        size="lg"
        type="submit"
      >
        {resetMutation.isPending
          ? t('account.resettingPassword')
          : t('account.resetPassword')}
      </Button>
    </form>
  )
}
