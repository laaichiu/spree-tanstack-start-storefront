import { cn } from '@/lib/utils'

type ProductSaleBadgeProps = {
  label: string
  tone?: 'sale' | 'neutral'
}

export function ProductSaleBadge({
  label,
  tone = 'sale',
}: ProductSaleBadgeProps) {
  return (
    <span
      aria-label={label}
      className={cn(
        'pointer-events-none bg-background px-2 py-1 text-sm leading-5 font-normal whitespace-nowrap',
        tone === 'sale' ? 'text-destructive' : 'text-foreground',
      )}
    >
      {label}
    </span>
  )
}
