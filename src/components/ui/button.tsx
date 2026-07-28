import type { ComponentPropsWithoutRef } from 'react'
import { Button as BaseButton } from '@base-ui/react/button'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'text-sm leading-4 font-normal uppercase inline-flex items-center justify-center gap-2 rounded-sm border transition-colors focus-visible:focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55',
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

export function buttonClassName({
  variant,
  size,
  className,
}: {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  className?: string
} = {}) {
  return cn(buttonVariants({ variant, size }), className)
}

type ButtonProps = ComponentPropsWithoutRef<typeof BaseButton> & {
  className?: string
} & VariantProps<typeof buttonVariants>

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
