import { cn } from '@/lib/utils'

type ProductDetailImageZoomProgressProps = {
  className?: string
  imageCount: number
  previewLabel: string
  selectedIndex: number
}

export function ProductDetailImageZoomProgress({
  className,
  imageCount,
  previewLabel,
  selectedIndex,
}: ProductDetailImageZoomProgressProps) {
  if (imageCount <= 1) {
    return null
  }

  return (
    <div
      aria-label={`${previewLabel}: ${selectedIndex + 1} / ${imageCount}`}
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
