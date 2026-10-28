import type { ComponentProps } from 'react'
import { User } from 'lucide-react'

import { Input } from '@/components/ui/input'

import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from './account-ui-view'

type AccountNameInputProps = ComponentProps<typeof Input>

export function AccountRegisterNameFieldsView({
  firstName,
  lastName,
}: {
  firstName: AccountNameInputProps
  lastName: AccountNameInputProps
}) {
  return (
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
  )
}
