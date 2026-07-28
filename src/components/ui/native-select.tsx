import type { ComponentPropsWithoutRef } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

export type NativeSelectOption = {
  disabled?: boolean
  label: string
  value: string
}

type NativeSelectProps = Omit<
  ComponentPropsWithoutRef<'select'>,
  'children' | 'onChange'
> & {
  label: string
  labelClassName?: string
  onValueChange: (value: string) => void
  options: NativeSelectOption[]
  value: string
}

export function NativeSelect({
  className,
  disabled,
  id,
  label,
  labelClassName,
  onValueChange,
  options,
  value,
  ...props
}: NativeSelectProps) {
  return (
    <div className="block">
      <label
        className={cn(
          'text-sm leading-4 font-normal uppercase mb-2 block text-muted-foreground',
          labelClassName,
        )}
        htmlFor={id}
      >
        {label}
      </label>
      <span className="relative block">
        <select
          aria-label={label}
          className={cn(
            'text-lg leading-4 font-normal uppercase h-14 w-full appearance-none rounded-sm border border-border bg-background px-4 pr-11 text-foreground outline-none transition hover:border-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
            className,
          )}
          disabled={disabled}
          id={id}
          onChange={(event) => onValueChange(event.target.value)}
          value={value}
          {...props}
        >
          {options.map((option) => (
            <option
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </div>
  )
}
