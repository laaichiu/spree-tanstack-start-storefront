import { X } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

import { cn } from './utils'

type CloseIconProps = Omit<
  LucideProps,
  'absoluteStrokeWidth' | 'children' | 'strokeWidth' | 'viewBox'
> & {
  strokeWidth?: 1.35 | 2
}

export function CloseIcon({
  className,
  strokeWidth = 2,
  ...props
}: CloseIconProps) {
  return (
    <X
      aria-hidden="true"
      className={cn('size-3', className)}
      {...props}
      strokeWidth={strokeWidth}
      // Lucide's X runs from 6 to 18. Include its round, 2-unit stroke,
      // rather than the unused space in the standard 24-unit viewBox.
      viewBox="5 5 14 14"
    />
  )
}
