import type { ReactNode } from 'react'

type CollectionCardViewProps = {
  imageUrl: string | null
  name: string
  renderLink: (content: ReactNode, className?: string) => ReactNode
  shopAllLabel: string
}

export function CollectionCardView({
  imageUrl,
  name,
  renderLink,
  shopAllLabel,
}: CollectionCardViewProps) {
  return renderLink(
    <div className="relative aspect-square overflow-hidden bg-muted">
      {imageUrl ? (
        <img
          alt={name}
          className="h-full w-full object-cover object-center transition duration-500 motion-reduce:transition-none group-hover:scale-105"
          decoding="async"
          loading="lazy"
          src={imageUrl}
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-6 py-7 text-center text-white">
        <h3 className="text-xs leading-snug font-semibold tracking-wider break-words uppercase">
          {name}
        </h3>
        <span className="mt-3 inline-flex border-b border-white/80 pb-1 text-xs font-light tracking-wider uppercase">
          {shopAllLabel}
        </span>
      </div>
    </div>,
    'group block text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  )
}
