import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
  CircleAlert,
  CircleCheck,
  Mail,
  Phone,
  Store,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { updateCustomerProfile } from '@/lib/account/api/customer-session.functions'
import {
  AccountMessage,
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from '@/components/account/account-ui'
import { useAccountSession } from '@/components/account/account-session-provider'
import type { CustomerProfile } from '@/lib/account/model/customer'
import { customerProfileUpdateSchema } from '@/lib/account/validation/profile'
import type { CustomerProfileUpdateInput } from '@/lib/account/validation/profile'
import { useMarket } from '@/components/layout/market-provider'

function joinCustomerName({
  firstName,
  lastName,
}: {
  firstName: string | null
  lastName: string | null
}) {
  return [firstName, lastName].filter(Boolean).join(' ')
}

function ProfileFact({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex gap-4 border-b border-border py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-border text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <dt className="text-sm leading-4 font-normal uppercase text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-2 text-sm leading-6 text-foreground break-words">
          {value}
        </dd>
      </div>
    </div>
  )
}

function getProfileFormValues(
  customer: CustomerProfile,
): CustomerProfileUpdateInput {
  return {
    acceptsEmailMarketing: customer.acceptsEmailMarketing,
    email: customer.email,
    firstName: customer.firstName ?? '',
    lastName: customer.lastName ?? '',
    phone: customer.phone ?? '',
  }
}

export function AccountProfileDetails() {
  const customer = useAccountSession()
  const router = useRouter()
  const { t } = useMarket()
  const [savedMessageVisible, setSavedMessageVisible] = useState(false)
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<CustomerProfileUpdateInput>({
    defaultValues: getProfileFormValues(customer),
    resolver: zodResolver(customerProfileUpdateSchema),
  })
  const profileMutation = useMutation({
    mutationFn: (data: CustomerProfileUpdateInput) =>
      updateCustomerProfile({ data }),
    onError: () => {
      setSavedMessageVisible(false)
    },
    onSuccess: async (updatedCustomer) => {
      reset(getProfileFormValues(updatedCustomer))
      setSavedMessageVisible(true)
      await router.invalidate()
    },
  })

  useEffect(() => {
    reset(getProfileFormValues(customer))
    setSavedMessageVisible(false)
  }, [customer, reset])

  const fullName = joinCustomerName(customer)
  const notProvided = <AccountPill>{t('account.notProvided')}</AccountPill>

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <AccountSurface className="xl:col-span-3">
        <AccountSectionHeader
          description={t('account.profileDescription')}
          title={t('account.profile')}
        />

        <form
          className="mt-6 space-y-5"
          onSubmit={handleSubmit((data) => {
            setSavedMessageVisible(false)
            profileMutation.mutate(data)
          })}
        >
          {profileMutation.isError ? (
            <AccountMessage tone="error">
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <p>{t('account.profileUpdateFailed')}</p>
            </AccountMessage>
          ) : null}

          {savedMessageVisible ? (
            <AccountMessage tone="success">
              <CircleCheck
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <p>{t('account.profileSaved')}</p>
            </AccountMessage>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              autoComplete="given-name"
              className={accountAuthInputClassName}
              disabled={profileMutation.isPending}
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
              disabled={profileMutation.isPending}
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
            disabled={profileMutation.isPending}
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
            autoComplete="tel"
            className={accountAuthInputClassName}
            disabled={profileMutation.isPending}
            inputMode="tel"
            label={t('account.phone')}
            labelClassName={accountAuthLabelClassName}
            leadingIcon={<Phone aria-hidden="true" className="h-4 w-4" />}
            placeholder={t('account.phonePlaceholder')}
            type="tel"
            {...register('phone')}
          />

          <Controller
            control={control}
            name="acceptsEmailMarketing"
            render={({ field }) => (
              <Checkbox
                checked={field.value}
                description={t('account.profileMarketingOptInDescription')}
                disabled={profileMutation.isPending}
                label={t('account.marketingOptIn')}
                onCheckedChange={(value) => field.onChange(value === true)}
              />
            )}
          />

          <div className="flex justify-end border-t border-border pt-5">
            <Button
              disabled={profileMutation.isPending || !isDirty}
              size="lg"
              type="submit"
            >
              {profileMutation.isPending
                ? t('account.savingProfile')
                : t('account.saveProfile')}
            </Button>
          </div>
        </form>
      </AccountSurface>

      <AccountSurface className="xl:col-span-2">
        <AccountSectionHeader
          description={t('account.accountInformationDescription')}
          title={t('account.accountInformation')}
        />

        <dl className="mt-6">
          <ProfileFact
            icon={<User aria-hidden="true" className="h-4 w-4" />}
            label={t('account.name')}
            value={fullName || notProvided}
          />
          <ProfileFact
            icon={<Mail aria-hidden="true" className="h-4 w-4" />}
            label={t('account.email')}
            value={customer.email}
          />
          <ProfileFact
            icon={<Phone aria-hidden="true" className="h-4 w-4" />}
            label={t('account.phone')}
            value={customer.phone || notProvided}
          />
          <ProfileFact
            icon={<Store aria-hidden="true" className="h-4 w-4" />}
            label={t('account.storeCredit')}
            value={customer.displayAvailableStoreCreditTotal || notProvided}
          />
        </dl>
      </AccountSurface>
    </div>
  )
}
