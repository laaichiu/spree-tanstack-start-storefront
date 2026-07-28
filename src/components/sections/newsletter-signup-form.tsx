import { ArrowRight } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { useNewsletterSubscriptionForm } from '@/components/newsletter/use-newsletter-subscription-form'

export function NewsletterSignupForm() {
  const { market, t } = useMarket()
  const {
    errors,
    isSubmitting,
    message,
    register,
    requestError,
    clearRequestError,
    submit,
  } = useNewsletterSubscriptionForm({
    market,
    messages: {
      requestFailed: t('footer.newsletterFailed'),
      unsupported: t('footer.newsletterUnsupported'),
    },
  })

  return (
    <form className="mt-6" onSubmit={submit}>
      <div className="flex overflow-hidden border border-input bg-background">
        <label className="sr-only" htmlFor="footer-newsletter-email">
          {t('footer.emailAddress')}
        </label>
        <input
          autoComplete="email"
          className="text-lg leading-4 font-normal uppercase h-14 min-w-0 flex-1 bg-background px-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
          disabled={isSubmitting}
          id="footer-newsletter-email"
          placeholder={t('footer.emailAddress').toUpperCase()}
          type="email"
          {...register('email', { onChange: clearRequestError })}
        />
        <button
          aria-label={t('footer.newsletterSubmit')}
          className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90 focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
      <div aria-live="polite" className="text-sm leading-6 mt-3 min-h-5">
        {errors.email?.message ? (
          <p className="text-destructive">{errors.email.message}</p>
        ) : message ? (
          <p className="text-foreground">{message}</p>
        ) : requestError ? (
          <p className="text-destructive">{requestError}</p>
        ) : (
          <p className="text-muted-foreground">{t('footer.newsletterHint')}</p>
        )}
      </div>
    </form>
  )
}
