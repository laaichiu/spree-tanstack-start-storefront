import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import type { StorefrontBranding } from '@/lib/storefront/contracts'
import { CheckoutLayoutShellView } from '@/components/checkout/checkout-layout-shell-view'
import { legalLinks } from '@/config/footer'

export function CheckoutLayoutShell({
  branding,
  children,
}: {
  branding: StorefrontBranding
  children: ReactNode
}) {
  const { market, t } = useMarket()
  const marketParams = { country: market.country, locale: market.locale }

  return (
    <CheckoutLayoutShellView
      capabilities={{
        renderHomeLink: (content, className) => (
          <Link
            aria-label={`${branding.name} home`}
            className={className}
            params={marketParams}
            preload={false}
            to="/$country/$locale"
          >
            {content}
          </Link>
        ),
        renderLegalLink: (link, { children: linkChildren, className }) => {
          const config = legalLinks.find(
            (candidate) => candidate.policySlug === link.id,
          )

          return config ? (
            <Link
              className={className}
              params={{ ...marketParams, slug: config.policySlug }}
              to="/$country/$locale/policies/$slug"
            >
              {linkChildren}
            </Link>
          ) : (
            linkChildren
          )
        },
      }}
      model={{
        branding,
        legalLinks: legalLinks.map((link) => ({
          id: link.policySlug,
          label: t(link.labelKey),
        })),
      }}
      content={children}
    />
  )
}
