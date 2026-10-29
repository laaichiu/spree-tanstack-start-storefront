import type { ReactNode } from 'react'

type ProductRelatedProductsViewProps = {
  cards: ReactNode
  title: string
}

export function ProductRelatedProductsView({
  cards,
  title,
}: ProductRelatedProductsViewProps) {
  return (
    <section
      aria-labelledby="related-products-title"
      className="mx-auto mt-14 w-full max-w-[78rem] space-y-6 lg:mt-20"
    >
      <h2
        className="text-lg md:text-xl font-normal tracking-wider text-foreground"
        id="related-products-title"
      >
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-4">
        {cards}
      </div>
    </section>
  )
}
