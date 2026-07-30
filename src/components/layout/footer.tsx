import { Link } from '@tanstack/react-router'

import {
  DeferredFooterMarketSelector,
  DeferredFooterNewsletterSignup,
} from '@/components/layout/footer-interactive'
import { useMarket } from '@/components/layout/market-provider'
import type { StorefrontBranding } from '@/lib/storefront/model/storefront-branding'

const footerColumns = [
  {
    titleKey: 'footer.account',
    links: [
      {
        labelKey: 'footer.manageAccount',
        preload: false,
        to: '/$country/$locale/account',
      },
      { labelKey: 'footer.signUp', to: '/$country/$locale/account/register' },
      {
        labelKey: 'footer.redeemGiftCard',
        preload: false,
        to: '/$country/$locale/account/gift-cards',
      },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { labelKey: 'footer.about' },
      { labelKey: 'footer.environmentalInitiatives' },
      { labelKey: 'footer.dei' },
      { labelKey: 'footer.careers' },
      { labelKey: 'footer.accessibility' },
    ],
  },
  {
    titleKey: 'footer.getHelp',
    links: [
      { labelKey: 'footer.helpCenter' },
      { labelKey: 'footer.liveChat' },
      { labelKey: 'footer.returnPolicy', policySlug: 'returns-policy' },
      { labelKey: 'footer.shippingInfo', policySlug: 'shipping-policy' },
      { labelKey: 'footer.bulkOrders' },
    ],
  },
  {
    titleKey: 'footer.connect',
    links: [
      { labelKey: 'footer.instagram', href: 'https://www.instagram.com/' },
      { labelKey: 'footer.tiktok', href: 'https://www.tiktok.com/' },
      { labelKey: 'footer.youtube', href: 'https://www.youtube.com/' },
      { labelKey: 'footer.pinterest', href: 'https://www.pinterest.com/' },
      { labelKey: 'footer.affiliates' },
      { labelKey: 'footer.ourStores' },
    ],
  },
] as const

const legalLinks = [
  { labelKey: 'footer.shippingPolicy', slug: 'shipping-policy' },
  { labelKey: 'footer.privacyPolicy', slug: 'privacy-policy' },
  { labelKey: 'footer.returnPolicy', slug: 'returns-policy' },
  { labelKey: 'footer.termsOfService', slug: 'terms-of-service' },
] as const

const footerHeadingClass =
  'text-sm leading-4 font-semibold uppercase text-foreground'

const footerNavLinkClass =
  'link-underline-sweep text-sm leading-4 font-normal uppercase inline-block w-fit text-foreground after:bottom-0 focus-visible:focus-ring'

const footerLegalLinkClass =
  'link-underline-sweep text-sm leading-4 font-normal uppercase inline-block w-fit text-foreground after:bottom-0 focus-visible:focus-ring'

export function Footer({ branding }: { branding: StorefrontBranding }) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="w-full px-4 pt-12 pb-8 lg:pt-14 lg:pb-10">
        <div className="space-y-10 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(24rem,1.2fr)] lg:gap-x-10 lg:gap-y-10 lg:space-y-0 xl:gap-x-16">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-x-10 xl:gap-x-16">
            {footerColumns.map((column) => (
              <section key={column.titleKey}>
                <h2 className={footerHeadingClass}>{t(column.titleKey)}</h2>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.labelKey}>
                      {'to' in link ? (
                        <Link
                          className={footerNavLinkClass}
                          params={marketParams}
                          preload={'preload' in link ? link.preload : undefined}
                          to={link.to}
                        >
                          {t(link.labelKey)}
                        </Link>
                      ) : 'policySlug' in link ? (
                        <Link
                          className={footerNavLinkClass}
                          params={{
                            ...marketParams,
                            slug: link.policySlug,
                          }}
                          to="/$country/$locale/policies/$slug"
                        >
                          {t(link.labelKey)}
                        </Link>
                      ) : 'href' in link ? (
                        <a
                          className={footerNavLinkClass}
                          href={link.href}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {t(link.labelKey)}
                        </a>
                      ) : (
                        <span className="text-sm leading-4 font-normal uppercase text-foreground">
                          {t(link.labelKey)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <section className="lg:pl-2 xl:pl-6">
            <h2 className="text-xl leading-tight max-w-md text-foreground">
              {t('footer.newsletterHeading')}
            </h2>
            <DeferredFooterNewsletterSignup
              retryLabel={t('footer.retryInteractive')}
            />
            <p className="text-sm leading-6 mt-5 max-w-md text-muted-foreground">
              {t('footer.newsletterConsent')}
            </p>
          </section>
        </div>

        <div className="mt-16 pt-6">
          <DeferredFooterMarketSelector
            retryLabel={t('footer.retryInteractive')}
          />

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {legalLinks.map((link) => (
                <Link
                  className={footerLegalLinkClass}
                  key={link.slug}
                  params={{
                    ...marketParams,
                    slug: link.slug,
                  }}
                  to="/$country/$locale/policies/$slug"
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </div>

            <p className="text-sm leading-4 font-normal uppercase text-muted-foreground">
              © {new Date().getFullYear()} {branding.name}.{' '}
              {t('footer.allRightsReserved')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
