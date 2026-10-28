import type { ReactNode } from 'react'

type CollectionGridSectionViewProps = {
  content: ReactNode
  title: string
}

export function CollectionGridSectionView({
  content,
  title,
}: CollectionGridSectionViewProps) {
  return (
    <section className="bg-background">
      <div className="px-4 py-4">
        <h2 className="text-lg md:text-xl text-foreground uppercase text-start">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content}
      </div>
    </section>
  )
}
