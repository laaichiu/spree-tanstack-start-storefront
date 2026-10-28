import type { ComponentPropsWithoutRef, ReactNode } from 'react'

import { SheetTrigger } from '@/components/ui/sheet'

type HeaderSheetTriggerProps = Pick<
  ComponentPropsWithoutRef<typeof SheetTrigger>,
  'handle' | 'id' | 'onClick'
>

export function HeaderSheetTriggerView({
  ariaLabel,
  children,
  className,
  dataUnderlineActive,
  onPreload,
  triggerProps,
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
  dataUnderlineActive?: string
  onPreload: () => void
  triggerProps: HeaderSheetTriggerProps
}) {
  return (
    <SheetTrigger
      {...triggerProps}
      aria-label={ariaLabel}
      className={className}
      data-underline-active={dataUnderlineActive}
      onFocus={onPreload}
      onMouseEnter={onPreload}
      onPointerDown={onPreload}
      type="button"
    >
      {children}
    </SheetTrigger>
  )
}
