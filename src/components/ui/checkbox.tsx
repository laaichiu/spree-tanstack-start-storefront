import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<typeof BaseCheckbox.Root>,
  'className'
> & {
  className?: string
  description?: ReactNode
  label: ReactNode
}

export function Checkbox({
  className,
  description,
  label,
  ...props
}: CheckboxProps) {
  return (
    <label className="text-sm leading-6 grid cursor-pointer grid-cols-[auto_1fr] gap-3 text-foreground has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55">
      <BaseCheckbox.Root
        className={cn(
          'mt-0.5 flex h-5 w-5 items-center justify-center rounded-sm border border-input bg-background text-primary-foreground outline-none transition focus-visible:focus-ring data-[checked]:border-primary data-[checked]:bg-primary',
          className,
        )}
        {...props}
      >
        <BaseCheckbox.Indicator>
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <span>
        <span className="text-sm leading-4 font-normal uppercase">{label}</span>
        {description ? (
          <span className="mt-1 block leading-5 text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}
