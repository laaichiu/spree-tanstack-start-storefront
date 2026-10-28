import { cn } from '@/components/ui/utils'

type ProductGalleryProgressViewProps = {
  ariaLabel: string
  className?: string
  imageCount: number
  selectedIndex: number
}

export function ProductGalleryProgressView({
  ariaLabel,
  className,
  imageCount,
  selectedIndex,
}: ProductGalleryProgressViewProps) {
  if (imageCount <= 1) {
    return null
  }

  return (
    <div
      aria-label={ariaLabel}
      aria-valuemax={imageCount}
      aria-valuemin={1}
      aria-valuenow={selectedIndex + 1}
      className={cn('relative h-0.5 bg-border', className)}
      role="progressbar"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          transform: `translateX(${selectedIndex * 100}%)`,
          width: `${100 / imageCount}%`,
        }}
      />
    </div>
  )
}
