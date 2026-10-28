import { cn } from '@/components/ui/utils'

export function ProductOfferBadgeView({
  className,
  label,
  tone = 'sale',
}: {
  className?: string
  label: string
  tone?: 'sale' | 'neutral'
}) {
  return (
    <span
      aria-label={label}
      className={cn(
        'pointer-events-none bg-background px-2 py-1 text-xs leading-5 font-normal whitespace-nowrap',
        tone === 'sale' ? 'text-destructive' : 'text-foreground',
        className,
      )}
    >
      {label}
    </span>
  )
}
