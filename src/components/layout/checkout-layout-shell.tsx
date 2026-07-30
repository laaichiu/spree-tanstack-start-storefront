import type { ReactNode } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { StorefrontBranding } from '@/lib/storefront/model/storefront-branding'

const checkoutLegalLinks = [
  { labelKey: 'footer.shippingPolicy', slug: 'shipping-policy' },
  { labelKey: 'footer.privacyPolicy', slug: 'privacy-policy' },
  { labelKey: 'footer.returnPolicy', slug: 'returns-policy' },
  { labelKey: 'footer.termsOfService', slug: 'terms-of-service' },
] as const

export function CheckoutLayoutShell({
  branding,
  children,
}: {
  branding: StorefrontBranding
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CheckoutHeader branding={branding} />
      <main className="min-h-checkout-entry">{children}</main>
      <CheckoutFooter />
    </div>
  )
}

function CheckoutHeader({ branding }: { branding: StorefrontBranding }) {
  const { market } = useMarket()
  const homeHref = `/${market.country}/${market.locale}`

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-22 items-center justify-center px-6">
        <a
          aria-label={`${branding.name} home`}
          className="inline-flex items-center justify-center focus-visible:focus-ring"
          href={homeHref}
        >
          {branding.logoUrl ? (
            <img
              alt={branding.name}
              className="h-8 w-auto object-contain sm:h-9"
              src={branding.logoUrl}
              width={189}
              height={76}
            />
          ) : (
            <span className="text-base leading-none font-semibold uppercase tracking-[0.16em]">
              {branding.name}
            </span>
          )}
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
