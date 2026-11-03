export function ProductImageFallbackView({
  label,
  variant = 'default',
}: {
  label: string
  variant?: 'compact' | 'default'
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted px-2 text-center">
      <span
        className={
          variant === 'compact'
            ? 'text-xs leading-4 tracking-wide text-foreground uppercase'
            : 'text-xs leading-5 tracking-wide text-foreground uppercase'
        }
      >
        {label}
      </span>
    </div>
  )
}
