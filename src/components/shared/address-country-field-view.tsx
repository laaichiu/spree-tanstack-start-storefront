import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/components/ui/utils'
import type { AddressRegionOption } from './address-region.types'

export type AddressCountryFieldLabels = {
  country: string
}

export type AddressCountryFieldActions = {
  blur?: () => void
  countryChange: (countryIso: string) => void
}

export function AddressCountryFieldView({
  actions,
  className,
  controlClassName,
  disabled,
  error,
  id,
  isLoading,
  labelClassName,
  labels,
  loadError,
  name,
  options,
  value,
}: {
  actions: AddressCountryFieldActions
  className?: string
  controlClassName?: string
  disabled?: boolean
  error?: string
  id: string
  isLoading?: boolean
  labelClassName?: string
  labels: AddressCountryFieldLabels
  loadError?: string
  name?: string
  options: readonly AddressRegionOption[]
  value: string
}) {
  return (
    <div className={className}>
      <NativeSelect
        className={cn(
          'h-12 bg-background text-base leading-5',
          controlClassName,
        )}
        disabled={disabled || isLoading}
        id={id}
        label={labels.country}
        labelClassName={labelClassName}
        name={name}
        onBlur={actions.blur}
        onValueChange={actions.countryChange}
        options={[...options]}
        value={value}
      />
      {error ? (
        <p className="mt-2 text-xs leading-6 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {loadError ? (
        <p className="mt-2 text-xs leading-6 text-destructive">{loadError}</p>
      ) : null}
    </div>
  )
}
