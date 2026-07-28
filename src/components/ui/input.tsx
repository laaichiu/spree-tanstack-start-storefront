import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Field } from '@base-ui/react/field'

import { cn } from '@/lib/utils'

type InputProps = Omit<
  ComponentPropsWithRef<typeof Field.Control>,
  'className'
> & {
  className?: string
  description?: ReactNode
  error?: ReactNode
  label: ReactNode
  labelClassName?: string
  leadingIcon?: ReactNode
  trailingSlot?: ReactNode
}

export function Input({
  className,
  description,
  error,
  label,
  labelClassName,
  leadingIcon,
  ref,
  trailingSlot,
  disabled,
  id,
  ...props
}: InputProps) {
  const controlClassName = cn(
    'text-lg leading-6 h-11 w-full rounded-sm border border-input bg-background px-3 text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:focus-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
    leadingIcon ? 'pl-11' : null,
    trailingSlot ? 'pr-12' : null,
    error ? 'border-destructive' : null,
    className,
  )

  return (
    <Field.Root disabled={disabled} invalid={Boolean(error)}>
      <Field.Label
        className={cn(
          'text-sm leading-4 font-normal uppercase mb-2 block text-foreground',
          labelClassName,
        )}
      >
        {label}
      </Field.Label>
      {leadingIcon || trailingSlot ? (
        <div className="relative">
          {leadingIcon ? (
            <span className="pointer-events-none absolute top-1/2 left-4 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-muted-foreground">
              {leadingIcon}
            </span>
          ) : null}
          <Field.Control
            className={controlClassName}
            disabled={disabled}
            id={id}
            ref={ref}
            {...props}
          />
          {trailingSlot ? (
            <span className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center">
              {trailingSlot}
            </span>
          ) : null}
        </div>
      ) : (
        <Field.Control
          className={controlClassName}
          disabled={disabled}
          id={id}
          ref={ref}
          {...props}
        />
      )}
      {description ? (
        <Field.Description className="text-sm leading-6 mt-2 text-muted-foreground">
          {description}
        </Field.Description>
      ) : null}
      {error ? (
        <p className="text-sm leading-6 mt-2 text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </Field.Root>
  )
}
