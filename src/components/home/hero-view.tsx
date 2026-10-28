import { preload } from 'react-dom'
import type { ReactNode } from 'react'

const HERO_IMAGE_SRC_SET =
  '/hero-828.webp 828w, /hero-960.webp 960w, /hero-1600.webp 1600w, /hero-2400.webp 2400w'
const HERO_IMAGE_SIZES = '100vw'

type HeroViewProps = {
  ctaLabel: string
  description: string
  eyebrow: string
  renderCta: (content: ReactNode, className?: string) => ReactNode
  title: string
}

export function HeroView({
  ctaLabel,
  description,
  eyebrow,
  renderCta,
  title,
}: HeroViewProps) {
  preload('/hero-828.webp', {
    as: 'image',
    fetchPriority: 'high',
    imageSizes: HERO_IMAGE_SIZES,
    imageSrcSet: HERO_IMAGE_SRC_SET,
    type: 'image/webp',
  })

  return (
    <section className="bg-background">
      <div className="relative isolate min-h-svh overflow-hidden">
        <picture>
          <source
            sizes={HERO_IMAGE_SIZES}
            srcSet={HERO_IMAGE_SRC_SET}
            type="image/webp"
          />
          <img
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center"
            decoding="async"
            fetchPriority="high"
            height={1600}
            sizes={HERO_IMAGE_SIZES}
            src="/hero.jpg"
            width={2400}
          />
        </picture>
        <div aria-hidden="true" className="absolute inset-0 bg-black/30" />
        <div className="relative flex min-h-svh items-center justify-center px-6 pt-16 pb-10 text-center sm:px-10 sm:pb-14 lg:pb-0">
          <div className="max-w-lg px-4 py-8 text-white sm:px-8 sm:py-10 lg:-translate-y-10">
            <p className="text-xs leading-4 font-normal uppercase text-white/90">
              {eyebrow}
            </p>
            <h1 className="text-2xl leading-tight md:text-3xl break-words mt-4 font-normal text-white uppercase">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-xs leading-6 text-white/90">
              {description}
            </p>
            <div className="mt-7 flex justify-center">
              {renderCta(
                ctaLabel,
                'text-xs leading-4 font-normal uppercase inline-flex border-b border-white/80 pb-1 text-white transition hover:border-white hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
