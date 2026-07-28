import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useRouter } from '@tanstack/react-router'
import { useMutation } from '@tanstack/react-query'
import { CircleAlert, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMarket } from '@/components/layout/market-provider'
import { loginCustomer } from '@/lib/account/api/login.functions'
import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
  accountInlineLinkClassName,
} from '@/components/account/account-ui'
import { customerLoginSchema } from '@/lib/account/validation/login'
import type { CustomerLoginInput } from '@/lib/account/validation/login'

export function AccountLoginForm({ redirectTo }: { redirectTo: string }) {
  const { market, t } = useMarket()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
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
  const loginMutation = useMutation({
    mutationFn: (data: CustomerLoginInput) => loginCustomer({ data }),
    onSuccess: async () => {
      await router.invalidate()
      await router.navigate({
        href: redirectTo,
      })
    },
  })
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const handleLoginSubmit = handleSubmit((data) => loginMutation.mutate(data))

  return (
    <form className="space-y-5" onSubmit={handleLoginSubmit}>
      {loginMutation.isError ? (
        <div className="flex gap-3 border border-destructive bg-muted px-4 py-3 text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm leading-6">
            {t('account.loginUnavailableMessage')}
          </p>
        </div>
      ) : null}

      <Input
        autoComplete="email"
        disabled={loginMutation.isPending}
        error={errors.email?.message ? t('account.invalidEmail') : null}
        inputMode="email"
        label={t('account.email')}
        labelClassName={accountAuthLabelClassName}
        leadingIcon={<Mail aria-hidden="true" className="h-4 w-4" />}
        placeholder={t('account.emailPlaceholder')}
        type="email"
        className={accountAuthInputClassName}
        {...register('email')}
      />

      <div className="space-y-2">
        <Input
          autoComplete="current-password"
          className={accountAuthInputClassName}
          disabled={loginMutation.isPending}
          error={
            errors.password?.message ? t('account.passwordRequired') : null
          }
          label={t('account.password')}
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
              disabled={loginMutation.isPending}
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

        <div className="flex justify-end">
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/forgot-password"
          >
            {t('account.forgotPassword')}
          </Link>
        </div>
      </div>

      <Button
        className="h-12 w-full"
        disabled={loginMutation.isPending}
        size="lg"
        type="submit"
      >
        {loginMutation.isPending ? t('account.signingIn') : t('account.signIn')}
      </Button>
    </form>
  )
}
