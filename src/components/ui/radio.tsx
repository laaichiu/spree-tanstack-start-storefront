import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Radio as BaseRadio } from '@base-ui/react/radio'
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group'

import { cn } from '@/lib/utils'

type RadioGroupProps = Omit<
  ComponentPropsWithoutRef<typeof BaseRadioGroup>,
  'className'
> & {
  className?: string
}

export function RadioGroup({ className, ...props }: RadioGroupProps) {
  return <BaseRadioGroup className={cn('rounded-sm', className)} {...props} />
}

type RadioOptionProps = Omit<
  ComponentPropsWithoutRef<typeof BaseRadio.Root>,
  'children' | 'className'
> & {
  className?: string
  description?: ReactNode
  label: ReactNode
  trailing?: ReactNode
}

export function RadioOption({
  className,
  description,
  label,
  trailing,
  ...props
}: RadioOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-4 text-left transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55',
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-4">
        <BaseRadio.Root
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-input bg-background outline-none transition focus-visible:focus-ring data-[checked]:border-foreground"
          {...props}
        >
          <BaseRadio.Indicator className="h-2.5 w-2.5 rounded-full bg-foreground" />
        </BaseRadio.Root>
        <span className="min-w-0">
          <span className="block text-lg leading-5 font-normal text-foreground">
            {label}
          </span>
          {description ? (
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      {trailing ? (
        <div className="shrink-0 text-sm leading-5 font-normal text-foreground">
          {trailing}
        </div>
      ) : null}
    </label>
  )
}
