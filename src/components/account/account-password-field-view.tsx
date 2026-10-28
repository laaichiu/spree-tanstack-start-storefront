import { LockKeyhole } from 'lucide-react'
import type { ComponentProps } from 'react'

import { Input } from '@/components/ui/input'

import { accountAuthInputClassName } from './account-ui-view'
import { AccountPasswordToggleView } from './account-password-toggle-view'

type AccountPasswordInputProps = Omit<
  ComponentProps<typeof Input>,
  'className' | 'leadingIcon' | 'trailingSlot'
>

export function AccountPasswordFieldView({
  ariaLabel,
  isVisible,
  onToggle,
  ...inputProps
}: AccountPasswordInputProps & {
  ariaLabel: string
  isVisible: boolean
  onToggle: () => void
}) {
  return (
    <Input
      {...inputProps}
      className={accountAuthInputClassName}
      leadingIcon={<LockKeyhole aria-hidden="true" className="h-4 w-4" />}
      trailingSlot={
        <AccountPasswordToggleView
          ariaLabel={ariaLabel}
          disabled={Boolean(inputProps.disabled)}
          isVisible={isVisible}
          onToggle={onToggle}
        />
      }
    />
  )
}
