import type { ComponentProps } from 'react'
import { Mail } from 'lucide-react'

import { Input } from '@/components/ui/input'

import {
  accountAuthInputClassName,
  accountAuthLabelClassName,
} from './account-ui-view'

type AccountEmailInputProps = ComponentProps<typeof Input>

export function AccountEmailFieldView(props: AccountEmailInputProps) {
  return (
    <Input
      {...props}
      className={accountAuthInputClassName}
      labelClassName={accountAuthLabelClassName}
      leadingIcon={<Mail aria-hidden="true" className="h-4 w-4" />}
    />
  )
}
