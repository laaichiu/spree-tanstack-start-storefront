import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { CircleAlert, Eye, EyeOff, LockKeyhole, Mail, User } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { registerCustomer } from '@/lib/account/api/account.functions'
import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from '@/components/account/account-ui'
import { useMarket } from '@/components/layout/market-provider'
import { customerRegisterSchema } from '@/lib/account/validation/register'
import type { CustomerRegisterInput } from '@/lib/account/validation/register'

export function AccountRegisterForm() {
  const { market, t } = useMarket()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false)
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
  const registerMutation = useMutation({
    mutationFn: (data: CustomerRegisterInput) => registerCustomer({ data }),
    onSuccess: async () => {
      await router.invalidate()
      await router.navigate({
        href: `/${market.country}/${market.locale}/account`,
      })
    },
  })
  const handleRegisterSubmit = handleSubmit((data) =>
    registerMutation.mutate(data),
  )

  return (
    <form className="space-y-5" onSubmit={handleRegisterSubmit}>
      {registerMutation.isError ? (
        <div className="flex gap-3 border border-destructive bg-muted px-4 py-3 text-destructive">
          <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm leading-6">
            {t('account.registerUnavailableMessage')}
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          autoComplete="given-name"
          className={accountAuthInputClassName}
          disabled={registerMutation.isPending}
          error={
            errors.firstName?.message ? t('account.firstNameRequired') : null
          }
          label={t('account.firstName')}
          labelClassName={accountAuthLabelClassName}
          leadingIcon={<User aria-hidden="true" className="h-4 w-4" />}
          placeholder={t('account.firstNamePlaceholder')}
          type="text"
          {...register('firstName')}
        />

        <Input
          autoComplete="family-name"
          className={accountAuthInputClassName}
          disabled={registerMutation.isPending}
          error={
            errors.lastName?.message ? t('account.lastNameRequired') : null
          }
          label={t('account.lastName')}
          labelClassName={accountAuthLabelClassName}
          placeholder={t('account.lastNamePlaceholder')}
          type="text"
          {...register('lastName')}
        />
      </div>

      <Input
        autoComplete="email"
        className={accountAuthInputClassName}
        disabled={registerMutation.isPending}
        error={errors.email?.message ? t('account.invalidEmail') : null}
        inputMode="email"
        label={t('account.email')}
        labelClassName={accountAuthLabelClassName}
        leadingIcon={<Mail aria-hidden="true" className="h-4 w-4" />}
        placeholder={t('account.emailPlaceholder')}
        type="email"
        {...register('email')}
      />

      <Input
        autoComplete="new-password"
        className={accountAuthInputClassName}
        disabled={registerMutation.isPending}
        error={errors.password?.message ? t('account.passwordMinLength') : null}
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
            disabled={registerMutation.isPending}
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
        disabled={registerMutation.isPending}
        error={
          errors.passwordConfirmation?.message
            ? t('account.passwordsDoNotMatch')
            : null
        }
        label={t('account.passwordConfirmation')}
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
            disabled={registerMutation.isPending}
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

      <Controller
        control={control}
        name="acceptsEmailMarketing"
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            disabled={registerMutation.isPending}
            label={t('account.marketingOptIn')}
            onCheckedChange={(value) => field.onChange(value === true)}
            description={t('account.marketingOptInDescription')}
          />
        )}
      />

      <Button
        className="h-12 w-full"
        disabled={registerMutation.isPending}
        size="lg"
        type="submit"
      >
        {registerMutation.isPending
          ? t('account.creatingAccount')
          : t('account.createAccount')}
      </Button>
    </form>
  )
}
