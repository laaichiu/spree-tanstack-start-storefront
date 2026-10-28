import { useState } from 'react'
import type { LayoutLinkRenderer } from '../contracts/layout'

export function DesktopMegaMenuFeaturedLinkView({
  imageAlt,
  imageUrl,
  label,
  renderLink,
}: {
  imageAlt: string
  imageUrl: string
  label: string
  renderLink: LayoutLinkRenderer
}) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)

  return renderLink(
    <>
      <div className="relative flex aspect-product w-full max-w-[17rem] items-center justify-center overflow-hidden bg-muted">
        {failedImageUrl === imageUrl ? (
          <span className="px-6 text-center text-xs text-muted-foreground">
            {imageAlt}
          </span>
        ) : (
          <img
            alt={imageAlt}
            className="h-full w-full object-cover object-center transition duration-500 motion-reduce:transition-none group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            height={340}
            onError={() => setFailedImageUrl(imageUrl)}
            src={imageUrl}
            width={272}
          />
        )}
      </div>
      <p className="pt-3 text-xs font-normal tracking-wider uppercase">
        {label}
      </p>
    </>,
    'group block max-w-[17rem] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
  )
}
