import type { FooterItem, FooterProps } from '../contracts/layout'
import { FooterLinkView } from './footer-link-view'

export type {
  FooterCapabilities,
  FooterColumn,
  FooterItem,
  FooterLinkItem,
  FooterLinkRenderer,
  FooterModel,
  FooterProps,
  FooterSlots,
} from '../contracts/layout'

export function FooterView({ capabilities, model, slots }: FooterProps) {
  const { columns, legalLinks, newsletter } = model

  function renderItem(item: FooterItem) {
    if (item.kind === 'text') {
      return <FooterLinkView>{item.label}</FooterLinkView>
    }

    return (
      <FooterLinkView
        capabilities={{
          renderLink: (content, className) =>
            capabilities.renderLink(item, {
              children: content,
              className,
            }),
        }}
      >
        {item.label}
      </FooterLinkView>
    )
  }

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="w-full px-4 pt-12 pb-8 lg:pt-14 lg:pb-10">
        <div className="space-y-10 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(24rem,1.2fr)] lg:gap-x-10 lg:gap-y-10 lg:space-y-0 xl:gap-x-16">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-x-10 xl:gap-x-16">
            {columns.map((column) => (
              <section key={column.id}>
                <h2 className="text-xs leading-4 font-semibold uppercase text-foreground">
                  {column.title}
                </h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.id}>{renderItem(link)}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="lg:pl-2 xl:pl-6">
            <h2 className="text-lg md:text-xl max-w-md text-foreground">
              {newsletter.title}
            </h2>
            {slots.newsletter}
            <p className="text-xs leading-6 mt-5 max-w-md text-muted-foreground">
              {newsletter.consent}
            </p>
          </section>
        </div>

        <div className="mt-16 pt-6">
          {slots.marketSelector}

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {legalLinks.map((link) => (
                <span key={link.id}>{renderItem(link)}</span>
              ))}
            </div>

            <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
              {slots.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
