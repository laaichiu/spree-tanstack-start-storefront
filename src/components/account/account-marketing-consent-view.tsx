import type { ReactNode } from 'react'

import { Checkbox } from '@/components/ui/checkbox'

export function AccountMarketingConsentView({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked?: boolean
  description?: ReactNode
  disabled?: boolean
  label: ReactNode
  onChange: (checked: boolean) => void
}) {
  return (
    <Checkbox
      checked={checked}
      description={description}
      disabled={disabled}
      label={label}
      onCheckedChange={(value) => onChange(value === true)}
    />
  )
}
