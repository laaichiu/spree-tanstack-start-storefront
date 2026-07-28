import type { ReactNode } from 'react'

export function SearchPanelSection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm leading-4 font-normal uppercase text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}
