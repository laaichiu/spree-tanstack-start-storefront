import {
  DeferredFooterMarketSelector,
  DeferredFooterNewsletterSignup,
} from '@/components/layout/footer-interactive'
import { createFooterLinkRenderer } from '@/components/layout/footer-link-renderer'
import { useMarket } from '@/components/layout/market-provider'
import type { StorefrontBranding } from '@/lib/storefront/contracts'
import type { FooterColumn, FooterItem } from '@/components/contracts/layout'
import { footerColumns, legalLinks } from '@/config/footer'
import { FooterView } from '@/components/layout/footer-view'

export function Footer({ branding }: { branding: StorefrontBranding }) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  const columns: FooterColumn[] = footerColumns.map((column) => ({
    id: column.titleKey,
    links: column.links.map((link) => ({
      id: link.labelKey,
      kind: link.kind === 'text' ? 'text' : 'link',
      label: t(link.labelKey),
    })),
    title: t(column.titleKey),
  }))

  const renderedLegalLinks: FooterItem[] = legalLinks.map((link) => ({
    id: link.policySlug,
    kind: 'link',
    label: t(link.labelKey),
  }))

  const renderLink = createFooterLinkRenderer(marketParams)

  return (
    <FooterView
      capabilities={{ renderLink }}
      model={{
        columns,
        legalLinks: renderedLegalLinks,
        newsletter: {
          consent: t('footer.newsletterConsent'),
          title: t('footer.newsletterHeading'),
        },
      }}
      slots={{
        copyright: (
          <>
            © {new Date().getFullYear()} {branding.name}.{' '}
            {t('footer.allRightsReserved')}
          </>
        ),
        marketSelector: (
          <DeferredFooterMarketSelector
            retryLabel={t('footer.retryInteractive')}
          />
        ),
        newsletter: (
          <DeferredFooterNewsletterSignup
            retryLabel={t('footer.retryInteractive')}
          />
        ),
      }}
    />
  )
}
