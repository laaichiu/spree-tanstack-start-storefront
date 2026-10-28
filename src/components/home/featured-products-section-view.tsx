import type { ReactNode } from 'react'

type FeaturedProductsSectionViewProps = {
  content: ReactNode
  renderViewAll: (content: ReactNode, className?: string) => ReactNode
  title: string
  viewAllLabel: string
}

export function FeaturedProductsSectionView({
  content,
  renderViewAll,
  title,
  viewAllLabel,
}: FeaturedProductsSectionViewProps) {
  return (
    <section className="bg-background">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-4 sm:gap-6">
          <h2 className="text-lg md:text-xl text-foreground uppercase text-start">
            {title}
          </h2>
          {renderViewAll(
            viewAllLabel,
            'text-xs leading-4 font-normal uppercase inline-flex border-b border-foreground/70 pb-1 text-foreground transition hover:border-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
        </div>
      </div>

      {content}
    </section>
  )
}
