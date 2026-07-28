import { Star } from 'lucide-react'

import { cn } from '@/lib/utils'

export function formatReviewRating(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0'
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function ReviewStars({
  className,
  label,
  rating,
}: {
  className?: string
  label: string
  rating: number
}) {
  const roundedRating = Math.round(rating)

  return (
    <span
      aria-label={label}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < roundedRating

        return (
          <Star
            aria-hidden="true"
            className={cn(
              'h-4 w-4',
              filled
                ? 'fill-foreground text-foreground'
                : 'fill-muted text-muted',
            )}
            key={index}
          />
        )
      })}
    </span>
  )
}
