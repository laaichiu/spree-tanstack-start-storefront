import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'

const checkoutLegalLinks = [
  { labelKey: 'footer.shippingPolicy', slug: 'shipping-policy' },
  { labelKey: 'footer.privacyPolicy', slug: 'privacy-policy' },
  { labelKey: 'footer.returnPolicy', slug: 'returns-policy' },
  { labelKey: 'footer.termsOfService', slug: 'terms-of-service' },
] as const

export function CheckoutLayoutShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CheckoutHeader />
      <main className="min-h-checkout-entry">{children}</main>
      <CheckoutFooter />
    </div>
  )
}

function CheckoutHeader() {
  const { market } = useMarket()
  const homeHref = `/${market.country}/${market.locale}`

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-22 items-center justify-center px-6">
        <a
          aria-label="Spree Storefront home"
          className="inline-flex items-center justify-center focus-visible:focus-ring"
          href={homeHref}
        >
          <img
            alt="Spree Storefront"
            className="h-8 w-auto object-contain sm:h-9"
            src="/spree.png"
          />
        </a>
      </div>
    </header>
  )
}

function CheckoutFooter() {
  const { market, t } = useMarket()

  return (
    <footer className="border-t border-border bg-background px-6 py-5">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {checkoutLegalLinks.map((link) => (
          <a
            className="border-b border-current text-sm leading-4 text-muted-foreground transition-colors hover:text-foreground focus-visible:focus-ring"
            href={`/${market.country}/${market.locale}/policies/${link.slug}`}
            key={link.slug}
          >
            {t(link.labelKey)}
          </a>
        ))}
      </div>
    </footer>
  )
}
