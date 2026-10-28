import type { ComponentProps, FormEventHandler } from 'react'
import { CircleAlert, CircleCheck, Mail, Phone, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AccountMessage,
  AccountSectionHeader,
  AccountSurface,
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from './account-ui-view'
import { AccountMarketingConsentView } from './account-marketing-consent-view'
import type { AccountProfileFormModel } from '@/components/contracts/account'

type AccountProfileFormFields = {
  email: ComponentProps<typeof Input>
  firstName: ComponentProps<typeof Input>
  lastName: ComponentProps<typeof Input>
  marketing: ComponentProps<typeof AccountMarketingConsentView>
  phone: ComponentProps<typeof Input>
}

export function AccountProfileFormView({
  fields,
  model,
  onSubmit,
}: {
  fields: AccountProfileFormFields
  model: AccountProfileFormModel
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  const {
    description,
    errorMessage,
    isDirty,
    isPending,
    saveLabel,
    savedMessage,
    savingLabel,
    title,
  } = model
  const { email, firstName, lastName, marketing, phone } = fields

  return (
    <AccountSurface className="xl:col-span-3">
      <AccountSectionHeader description={description} title={title} />

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        {errorMessage && (
          <AccountMessage tone="error">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <p>{errorMessage}</p>
          </AccountMessage>
        )}

        {savedMessage && (
          <AccountMessage tone="success">
            <CircleCheck
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <p>{savedMessage}</p>
          </AccountMessage>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            {...firstName}
            className={accountAuthInputClassName}
            labelClassName={accountAuthLabelClassName}
            leadingIcon={<User aria-hidden="true" className="h-4 w-4" />}
          />
          <Input
            {...lastName}
            className={accountAuthInputClassName}
            labelClassName={accountAuthLabelClassName}
          />
        </div>
        <Input
          {...email}
          className={accountAuthInputClassName}
          labelClassName={accountAuthLabelClassName}
          leadingIcon={<Mail aria-hidden="true" className="h-4 w-4" />}
        />
        <Input
          {...phone}
          className={accountAuthInputClassName}
          labelClassName={accountAuthLabelClassName}
          leadingIcon={<Phone aria-hidden="true" className="h-4 w-4" />}
        />
        <AccountMarketingConsentView {...marketing} />

        <div className="flex justify-end border-t border-border pt-5">
          <Button disabled={isPending || !isDirty} size="lg" type="submit">
            {isPending ? savingLabel : saveLabel}
          </Button>
        </div>
      </form>
    </AccountSurface>
  )
}
