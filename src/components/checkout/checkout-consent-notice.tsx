import { useMarket } from '@/components/layout/market-provider'

export function CheckoutConsentNotice() {
  const { market, t } = useMarket()
  const policyBaseHref = `/${market.country}/${market.locale}/policies`

  return (
    <section className="pt-4">
      <p className="text-sm leading-7 text-muted-foreground">
        {t('checkout.consentBeforeTerms')}{' '}
        <a
          className="text-foreground underline underline-offset-2 transition hover:text-muted-foreground focus-visible:focus-ring"
          href={`${policyBaseHref}/terms-of-service`}
        >
          {t('footer.termsOfService')}
        </a>{' '}
        {t('checkout.consentBetweenPolicies')}{' '}
        <a
          className="text-foreground underline underline-offset-2 transition hover:text-muted-foreground focus-visible:focus-ring"
          href={`${policyBaseHref}/privacy-policy`}
        >
          {t('footer.privacyPolicy')}
        </a>
        {t('checkout.consentAfterPrivacy')}
      </p>
    </section>
  )
}
