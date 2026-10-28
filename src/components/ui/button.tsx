import type { ComponentPropsWithoutRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

import { cn } from './utils'

const buttonVariants = cva(
  'text-xs leading-4 font-normal uppercase inline-flex items-center justify-center gap-2 rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55',
  {
    variants: {
      variant: {
        primary:
          'border-primary bg-primary text-primary-foreground hover:brightness-95',
        danger:
          'border-destructive bg-destructive text-primary-foreground hover:brightness-95',
        secondary:
          'border-border bg-secondary text-secondary-foreground hover:bg-muted',
        ghost:
          'border-transparent bg-transparent text-foreground hover:bg-muted',
        // The icon owns the layout size; only the transparent pointer target
        // expands, so edge alignment needs no padding or negative margin.
        icon: "relative h-fit w-fit shrink-0 cursor-pointer gap-0 rounded-none border-0 bg-transparent p-0 text-foreground before:absolute before:top-1/2 before:left-1/2 before:h-full before:min-h-11 before:w-full before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] hover:text-muted-foreground disabled:opacity-50 [&>svg]:pointer-events-none [&>svg]:block [&>svg]:shrink-0",
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonVariantProps = VariantProps<typeof buttonVariants>

export function buttonClassName(
  options?: ButtonVariantProps & { className?: string },
): string
export function buttonClassName<TState>(
  options: ButtonVariantProps & {
    className?: string | ((state: TState) => string | undefined)
  },
): string | ((state: TState) => string)
export function buttonClassName<TState>({
  variant,
  size,
  className,
}: {
  variant?: ButtonVariantProps['variant']
  size?: ButtonVariantProps['size']
  className?: string | ((state: TState) => string | undefined)
} = {}): string | ((state: TState) => string) {
  if (typeof className === 'function') {
    return (state) =>
      buttonClassName({ variant, size, className: className(state) })
  }

  return cn(
    buttonVariants({ variant, size: variant === 'icon' ? null : size }),
    className,
  )
}

type ButtonProps = ComponentPropsWithoutRef<typeof BaseButton> &
  ButtonVariantProps

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={buttonClassName({ variant, size, className })}
      type={type}
      {...props}
    />
  )
}
