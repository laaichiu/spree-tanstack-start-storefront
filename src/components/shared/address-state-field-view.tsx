import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/components/ui/utils'
import type { AddressRegionOption } from './address-region.types'

export type AddressStateFieldLabels = {
  loadingStates: string
  state: string
  stateTextPlaceholder: string
}

export type AddressStateFieldActions = {
  blur?: () => void
  stateAbbrChange: (stateAbbr: string) => void
  stateNameChange: (stateName: string) => void
}

export function AddressStateFieldView({
  actions,
  className,
  controlClassName,
  disabled,
  error,
  inputId,
  inputName,
  isLoading,
  labelClassName,
  labels,
  selectId,
  selectName,
  options,
  stateAbbr,
  stateName,
}: {
  actions: AddressStateFieldActions
  className?: string
  controlClassName?: string
  disabled?: boolean
  error?: string
  inputId: string
  inputName?: string
  isLoading?: boolean
  labelClassName?: string
  labels: AddressStateFieldLabels
  options: readonly AddressRegionOption[]
  selectId: string
  selectName?: string
  stateAbbr: string
  stateName: string
}) {
  if (isLoading) {
    return (
      <Input
        className={cn(
          'h-12 bg-background text-base leading-5',
          className,
          controlClassName,
        )}
        disabled
        id={inputId}
        label={labels.state}
        labelClassName={labelClassName}
        onBlur={actions.blur}
        placeholder={labels.loadingStates}
        type="text"
        value={stateName}
      />
    )
  }

  if (options.length > 1) {
    return (
      <div className={className}>
        <NativeSelect
          className={cn(
            'h-12 bg-background text-base leading-5',
            controlClassName,
          )}
          disabled={disabled}
          id={selectId}
          label={labels.state}
          labelClassName={labelClassName}
          name={selectName}
          onBlur={actions.blur}
          onValueChange={actions.stateAbbrChange}
          options={[...options]}
          value={stateAbbr}
        />
        {error ? (
          <p className="mt-2 text-xs leading-6 text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <Input
      className={cn(
        'h-12 bg-background text-base leading-5',
        className,
        controlClassName,
      )}
      disabled={disabled}
      error={error}
      id={inputId}
      label={labels.state}
      labelClassName={labelClassName}
      name={inputName}
      onBlur={actions.blur}
      onChange={(event) => actions.stateNameChange(event.currentTarget.value)}
      placeholder={labels.stateTextPlaceholder}
      type="text"
      value={stateName}
    />
  )
}
